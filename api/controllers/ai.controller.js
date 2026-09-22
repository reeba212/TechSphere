import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';
import Post from '../models/post.model.js';
import Chunk from '../models/chunk.model.js';
import { aiClient, isDailyQuotaExhausted } from '../utils/aiClient.js';
import { htmlToText } from '../utils/sanitize.js';
import { EXPLAIN_MODES } from '../validators/ai.validator.js';

const VECTOR_INDEX = 'chunk_vector_index';
const MIN_SCORE = 0.6; // cosine similarity below this = "not relevant enough" (guardrail)

// Swaps the raw Gemini error blob for a message a reader can actually parse.
const forwardAiError = (error, next) => {
    if (isDailyQuotaExhausted(error)) {
        return next(errorHandler(503, "TechSphere's AI features have hit their daily usage limit. Please try again later."));
    }
    next(error);
};

// Runs $vectorSearch on Chunk and joins in the parent post's title/slug/published.
// `filter` may narrow the search to specific post ids (Atlas filter field, see docs/BUILD_PLAN.md).
const searchChunks = async (queryVector, { limit, postIds }) => {
    const pipeline = [
        {
            $vectorSearch: {
                index: VECTOR_INDEX,
                path: 'embedding',
                queryVector,
                numCandidates: Math.max(150, limit * 15),
                limit,
                ...(postIds ? { filter: { post: { $in: postIds } } } : {}),
            },
        },
        { $set: { score: { $meta: 'vectorSearchScore' } } },
        {
            $lookup: {
                from: 'posts',
                localField: 'post',
                foreignField: '_id',
                as: 'postDoc',
                pipeline: [{ $project: { title: 1, slug: 1, published: 1 } }],
            },
        },
        { $unwind: '$postDoc' },
        { $match: { 'postDoc.published': true } },
        { $project: { text: 1, headingPath: 1, score: 1, post: '$postDoc' } },
    ];
    return Chunk.aggregate(pipeline);
};

export const semanticSearch = async (req, res, next) => {
    try {
        const { q, limit } = req.validated.query;
        const [queryVector] = await aiClient.embedBatch([q]);
        const hits = await searchChunks(queryVector, { limit: limit * 3 });

        const byPost = new Map();
        for (const hit of hits) {
            const id = String(hit.post._id);
            if (!byPost.has(id)) byPost.set(id, hit); // keep the best-scoring chunk per post
            if (byPost.size >= limit) break;
        }

        res.status(200).json([...byPost.values()].map((hit) => ({
            post: hit.post,
            headingPath: hit.headingPath,
            snippet: hit.text.slice(0, 240),
            score: hit.score,
        })));
    } catch (error) {
        forwardAiError(error, next);
    }
};

const ASK_SYSTEM = `You are the AI tutor embedded in TechSphere, a developer learning platform.
Answer the reader's question using ONLY the provided article excerpts. Be concise and technically accurate.
If the excerpts don't contain enough information to answer, say so plainly instead of guessing or using outside knowledge.
Do not mention that you were given excerpts; just answer as if you know the material.`;

export const ask = async (req, res, next) => {
    try {
        const { question, postId, seriesId } = req.validated.body;

        let postIds;
        if (postId) {
            postIds = [new mongoose.Types.ObjectId(postId)];
        } else if (seriesId) {
            const seriesPosts = await Post.find({ series: seriesId, published: true }, '_id');
            if (seriesPosts.length === 0) return next(errorHandler(404, 'Series not found or empty'));
            postIds = seriesPosts.map((p) => p._id);
        }

        const [queryVector] = await aiClient.embedBatch([question]);
        const hits = await searchChunks(queryVector, { limit: 6, postIds });

        if (hits.length === 0 || hits[0].score < MIN_SCORE) {
            return res.status(200).json({
                answer: "I couldn't find anything in TechSphere's articles that answers this. Try rephrasing, or ask about a topic that's covered here.",
                sources: [],
            });
        }

        const context = hits
            .map((h, i) => `[${i + 1}] Article: "${h.post.title}"${h.headingPath ? ` (section: ${h.headingPath})` : ''}\n${h.text}`)
            .join('\n\n');

        const answer = await aiClient.generate({
            system: ASK_SYSTEM,
            prompt: `Excerpts:\n${context}\n\nQuestion: ${question}`,
        });

        const sources = [];
        const seen = new Set();
        for (const h of hits) {
            const key = `${h.post._id}:${h.headingPath || ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            sources.push({ postId: h.post._id, title: h.post.title, slug: h.post.slug, headingPath: h.headingPath });
        }

        res.status(200).json({ answer, sources });
    } catch (error) {
        forwardAiError(error, next);
    }
};

const EXPLAIN_PROMPTS = {
    explain: 'Explain the following passage clearly and concisely for a developer learning this topic.',
    eli5: "Explain the following passage like I'm five — use a simple analogy, avoid jargon.",
    example: 'Give one concrete, concise example (code or otherwise, whichever fits) that illustrates the following passage.',
    explain_code: 'Explain what the following code does. Walk through the non-obvious parts only; skip anything self-explanatory.',
};

export const explain = async (req, res, next) => {
    try {
        const { postId, mode, selection } = req.validated.body;
        if (!EXPLAIN_MODES.includes(mode)) return next(errorHandler(400, 'Invalid mode'));

        const post = await Post.findById(postId, 'title content published');
        if (!post || !post.published) return next(errorHandler(404, 'Post not found'));

        const passage = selection || htmlToText(post.content).slice(0, 1500);
        const answer = await aiClient.generate({
            system: `You are the AI tutor embedded in TechSphere. Reply in plain text, no markdown headers, 2-6 sentences unless code requires more.`,
            prompt: `Article: "${post.title}"\n\n${EXPLAIN_PROMPTS[mode]}\n\nPassage:\n${passage}`,
        });

        res.status(200).json({ answer });
    } catch (error) {
        forwardAiError(error, next);
    }
};
