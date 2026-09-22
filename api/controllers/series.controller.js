import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';
import Series from '../models/series.model.js';
import Post from '../models/post.model.js';
import Progress from '../models/progress.model.js';
import { uniqueSlug } from '../utils/slug.js';
import { categoryExists } from '../utils/category.js';

const POST_FIELDS = 'title slug excerpt coverImage readTimeMins seriesOrder published';

export const create = async (req, res, next) => {
    try {
        const body = req.validated.body;
        const category = body.category || 'uncategorized';
        if (!(await categoryExists(category))) {
            return next(errorHandler(400, `category: Unknown category "${category}"`));
        }

        const series = await Series.create({
            title: body.title,
            slug: await uniqueSlug(Series, body.title),
            description: body.description || '',
            category,
            published: body.published ?? false,
        });
        res.status(201).json(series);
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const { page, limit, published } = req.validated.query;
        const isAdmin = Boolean(req.user?.isAdmin);

        const filter = {};
        if (!isAdmin || !published || published === 'true') filter.published = true;
        else if (published === 'false') filter.published = false;

        const [series, total] = await Promise.all([
            Series.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Series.countDocuments(filter),
        ]);

        res.status(200).json({ series, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

export const getBySlug = async (req, res, next) => {
    try {
        const series = await Series.findOne({ slug: req.params.slug });
        if (!series || (!series.published && !req.user?.isAdmin)) {
            return next(errorHandler(404, 'Series not found'));
        }

        const postFilter = { series: series._id, ...(req.user?.isAdmin ? {} : { published: true }) };
        const posts = await Post.find(postFilter, POST_FIELDS).sort({ seriesOrder: 1 });

        let completedIds = new Set();
        if (req.user) {
            const completed = await Progress.find(
                { user: req.user.id, post: { $in: posts.map((p) => p._id) }, completed: true },
                'post'
            );
            completedIds = new Set(completed.map((p) => p.post.toString()));
        }

        res.status(200).json({
            ...series.toObject(),
            posts: posts.map((p) => ({ ...p.toObject(), completed: completedIds.has(p._id.toString()) })),
        });
    } catch (error) {
        next(error);
    }
};

const findSeriesOr404 = async (seriesId) => {
    if (!mongoose.isValidObjectId(seriesId)) throw errorHandler(404, 'Series not found');
    const series = await Series.findById(seriesId);
    if (!series) throw errorHandler(404, 'Series not found');
    return series;
};

export const update = async (req, res, next) => {
    try {
        const series = await findSeriesOr404(req.params.seriesId);
        const body = req.validated.body;

        if (body.title !== undefined) series.title = body.title; // slug stays stable so links don't break
        if (body.description !== undefined) series.description = body.description;
        if (body.published !== undefined) series.published = body.published;
        if (body.category !== undefined) {
            if (!(await categoryExists(body.category))) {
                return next(errorHandler(400, `category: Unknown category "${body.category}"`));
            }
            series.category = body.category;
        }

        await series.save();
        res.status(200).json(series);
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const series = await findSeriesOr404(req.params.seriesId);
        await Post.updateMany({ series: series._id }, { $unset: { series: 1, seriesOrder: 1 } });
        await series.deleteOne();
        res.status(200).json('Series has been deleted');
    } catch (error) {
        next(error);
    }
};

// Replaces the series' full membership/order in one call: posts left out are removed
// from the series, posts included are (re)assigned seriesOrder by their position (D4).
export const setPosts = async (req, res, next) => {
    try {
        const series = await findSeriesOr404(req.params.seriesId);
        const postIds = [...new Set(req.validated.body.postIds)];

        const existing = await Post.countDocuments({ _id: { $in: postIds } });
        if (existing !== postIds.length) {
            return next(errorHandler(400, 'postIds: one or more posts do not exist'));
        }

        await Post.updateMany({ series: series._id, _id: { $nin: postIds } }, { $unset: { series: 1, seriesOrder: 1 } });
        await Promise.all(
            postIds.map((id, i) => Post.updateOne({ _id: id }, { series: series._id, seriesOrder: i + 1 }))
        );

        const posts = await Post.find({ series: series._id }, POST_FIELDS).sort({ seriesOrder: 1 });
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};
