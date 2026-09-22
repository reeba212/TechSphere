import Post from '../models/post.model.js';
import Chunk from '../models/chunk.model.js';
import { aiClient } from '../utils/aiClient.js';
import { chunkArticle } from '../utils/chunk.js';
import { htmlToText } from '../utils/sanitize.js';
import { JOB_SUMMARIZE, JOB_EMBED } from './aiQueue.js';

const SUMMARY_SYSTEM = 'You write short, accurate TL;DR summaries of technical articles for a developer learning platform. Reply with plain text only, 2-3 sentences, no markdown, no preamble.';

const summarize = async (postId) => {
    const post = await Post.findById(postId, 'title content published');
    if (!post || !post.published) return; // unpublished/deleted since the job was queued

    const text = htmlToText(post.content).slice(0, 12000); // stay well under the model's context
    const summary = await aiClient.generate({
        system: SUMMARY_SYSTEM,
        prompt: `Title: ${post.title}\n\nArticle:\n${text}`,
    });
    if (summary) await Post.updateOne({ _id: post._id }, { summary });
};

const EMBED_BATCH_SIZE = 20;

const embedPost = async (postId) => {
    const post = await Post.findById(postId, 'content published');
    await Chunk.deleteMany({ post: postId }); // always re-index from scratch, cheap and avoids stale leftovers
    if (!post || !post.published) return;

    const chunks = chunkArticle(post.content);
    if (chunks.length === 0) return;

    const docs = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
        const embeddings = await aiClient.embedBatch(batch.map((c) => c.text));
        batch.forEach((c, j) => docs.push({ post: postId, text: c.text, position: c.position, headingPath: c.headingPath, embedding: embeddings[j] }));
    }
    await Chunk.insertMany(docs);
};

export const processAiJob = async (job) => {
    const { postId } = job.data;
    if (job.name === JOB_SUMMARIZE) return summarize(postId);
    if (job.name === JOB_EMBED) return embedPost(postId);
    throw new Error(`Unknown job name: ${job.name}`);
};
