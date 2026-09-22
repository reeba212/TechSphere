import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';
import Post from '../models/post.model.js';
import Series from '../models/series.model.js';
import Progress from '../models/progress.model.js';
import Bookmark from '../models/bookmark.model.js';
import Chunk from '../models/chunk.model.js';
import { uniqueSlug } from '../utils/slug.js';
import { sanitizeArticleHtml, htmlToText, makeExcerpt, readTimeMins } from '../utils/sanitize.js';
import { categoryExists } from '../utils/category.js';
import { enqueuePostJobs } from '../queue/aiQueue.js';

// Never let a queue/Redis hiccup fail the request that publishes a post (DoD:
// "publishing an article returns immediately"). The worker will just never see the job.
const enqueueAiJobs = (postId) => {
    enqueuePostJobs(postId).catch((err) => console.error(`[ai queue] failed to enqueue jobs for post ${postId}:`, err.message));
};

const LIST_PROJECTION = '-content';
const AUTHOR_FIELDS = 'username profilePicture';
const SERIES_POST_FIELDS = 'title slug seriesOrder';

const hasVisibleContent = (html) => htmlToText(html).length > 0 || /<img\s/i.test(html);

export const create = async (req, res, next) => {
    try {
        const body = req.validated.body;

        const content = sanitizeArticleHtml(body.content);
        if (!hasVisibleContent(content)) {
            return next(errorHandler(400, 'content: Article content is empty'));
        }
        const category = body.category || 'uncategorized';
        if (!(await categoryExists(category))) {
            return next(errorHandler(400, `category: Unknown category "${category}"`));
        }

        const post = await Post.create({
            title: body.title,
            slug: await uniqueSlug(Post, body.title),
            content,
            excerpt: body.excerpt || makeExcerpt(content),
            coverImage: body.coverImage || '',
            category,
            tags: body.tags || [],
            published: body.published ?? false,
            readTimeMins: readTimeMins(content),
            author: req.user.id,
        });
        if (post.published) enqueueAiJobs(post._id);
        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const { page, limit, category, tag, q, sort, published } = req.validated.query;
        const isAdmin = Boolean(req.user?.isAdmin);

        const filter = {};
        // Drafts are only ever visible to admins, and only when they ask for them.
        if (!isAdmin || !published || published === 'true') filter.published = true;
        else if (published === 'false') filter.published = false;

        if (category) filter.category = category;
        if (tag) filter.tags = tag;
        if (q) filter.$text = { $search: q };

        const useRelevance = Boolean(q) && sort === 'relevance';
        const projection = useRelevance
            ? { content: 0, score: { $meta: 'textScore' } }
            : LIST_PROJECTION;
        const order = useRelevance
            ? { score: { $meta: 'textScore' } }
            : { createdAt: sort === 'oldest' ? 1 : -1 };

        const [posts, total] = await Promise.all([
            Post.find(filter, projection)
                .sort(order)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('author', AUTHOR_FIELDS),
            Post.countDocuments(filter),
        ]);

        res.status(200).json({ posts, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

// Resolves the previous/next article in the post's series, if any (for reader navigation).
const getSeriesContext = async (post, isAdmin) => {
    if (!post.series) return undefined;
    const filter = { series: post.series, ...(isAdmin ? {} : { published: true }) };
    const [series, siblings] = await Promise.all([
        Series.findById(post.series, 'title slug'),
        Post.find(filter, SERIES_POST_FIELDS).sort({ seriesOrder: 1 }),
    ]);
    if (!series) return undefined;
    const index = siblings.findIndex((p) => p._id.equals(post._id));
    return {
        series,
        position: index + 1,
        total: siblings.length,
        prev: index > 0 ? siblings[index - 1] : null,
        next: index !== -1 && index < siblings.length - 1 ? siblings[index + 1] : null,
    };
};

export const getBySlug = async (req, res, next) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug }).populate('author', AUTHOR_FIELDS);
        if (!post || (!post.published && !req.user?.isAdmin)) {
            return next(errorHandler(404, 'Post not found'));
        }

        const result = post.toObject();

        const seriesContext = await getSeriesContext(post, Boolean(req.user?.isAdmin));
        if (seriesContext) result.seriesContext = seriesContext;

        if (req.user) {
            const [progress, bookmarked] = await Promise.all([
                Progress.findOne({ user: req.user.id, post: post._id }, 'progressPercentage completed lastReadPosition'),
                Bookmark.exists({ user: req.user.id, post: post._id }),
            ]);
            result.progress = progress || null;
            result.bookmarked = Boolean(bookmarked);
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const related = async (req, res, next) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug }, 'category tags published');
        if (!post || (!post.published && !req.user?.isAdmin)) {
            return next(errorHandler(404, 'Post not found'));
        }
        const matches = [{ category: post.category }];
        if (post.tags.length) matches.push({ tags: { $in: post.tags } });

        const posts = await Post.find(
            { published: true, _id: { $ne: post._id }, $or: matches },
            LIST_PROJECTION
        )
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('author', AUTHOR_FIELDS);
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

const findPostOr404 = async (postId) => {
    if (!mongoose.isValidObjectId(postId)) throw errorHandler(404, 'Post not found');
    const post = await Post.findById(postId);
    if (!post) throw errorHandler(404, 'Post not found');
    return post;
};

export const update = async (req, res, next) => {
    try {
        const post = await findPostOr404(req.params.postId);
        const body = req.validated.body;
        const wasPublished = post.published;
        const contentChanged = body.content !== undefined;

        if (body.title !== undefined) post.title = body.title; // slug stays stable so links don't break
        if (body.coverImage !== undefined) post.coverImage = body.coverImage;
        if (body.tags !== undefined) post.tags = body.tags;
        if (body.published !== undefined) post.published = body.published;
        if (body.category !== undefined) {
            if (!(await categoryExists(body.category))) {
                return next(errorHandler(400, `category: Unknown category "${body.category}"`));
            }
            post.category = body.category;
        }
        if (body.content !== undefined) {
            const content = sanitizeArticleHtml(body.content);
            if (!hasVisibleContent(content)) {
                return next(errorHandler(400, 'content: Article content is empty'));
            }
            post.content = content;
            post.readTimeMins = readTimeMins(content);
            if (body.excerpt === undefined) post.excerpt = makeExcerpt(content);
        }
        if (body.excerpt !== undefined) post.excerpt = body.excerpt || makeExcerpt(post.content);

        await post.save();

        if (post.published && (contentChanged || !wasPublished)) {
            enqueueAiJobs(post._id); // (re-)index: newly published, or a published post's content changed
        } else if (wasPublished && !post.published) {
            await Chunk.deleteMany({ post: post._id }); // unpublished: drop it from search/RAG immediately
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const post = await findPostOr404(req.params.postId);
        await post.deleteOne();
        await Chunk.deleteMany({ post: post._id });
        res.status(200).json('Post has been deleted');
    } catch (error) {
        next(error);
    }
};
