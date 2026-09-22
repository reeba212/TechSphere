import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';
import Progress from '../models/progress.model.js';
import Post from '../models/post.model.js';
import Series from '../models/series.model.js';

const POST_FIELDS = 'title slug coverImage category readTimeMins series seriesOrder published';

export const upsert = async (req, res, next) => {
    try {
        const { postId } = req.params;
        if (!mongoose.isValidObjectId(postId) || !(await Post.exists({ _id: postId }))) {
            return next(errorHandler(404, 'Post not found'));
        }

        const body = req.validated.body;
        const update = {};
        if (body.progressPercentage !== undefined) update.progressPercentage = body.progressPercentage;
        if (body.lastReadPosition !== undefined) update.lastReadPosition = body.lastReadPosition;
        if (body.completed !== undefined) {
            update.completed = body.completed;
            update.completedAt = body.completed ? new Date() : null;
        }

        const progress = await Progress.findOneAndUpdate(
            { user: req.user.id, post: postId },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const { completed } = req.validated.query;
        const filter = { user: req.user.id };
        if (completed !== undefined) filter.completed = completed === 'true';

        const progress = await Progress.find(filter).sort({ updatedAt: -1 }).populate('post', POST_FIELDS);
        // A post can be deleted after progress was recorded; drop those dangling entries.
        res.status(200).json(progress.filter((p) => p.post));
    } catch (error) {
        next(error);
    }
};

// One row per series the user has touched: how many of its posts are done, and
// which one to resume at. Powers the dashboard's "Continue Learning" section.
export const seriesSummary = async (req, res, next) => {
    try {
        const progressDocs = await Progress.find({ user: req.user.id }).populate('post', 'series');
        const touchedSeriesIds = [
            ...new Set(progressDocs.filter((p) => p.post?.series).map((p) => p.post.series.toString())),
        ];
        if (touchedSeriesIds.length === 0) return res.status(200).json([]);

        const completedPostIds = new Set(
            progressDocs.filter((p) => p.completed && p.post).map((p) => p.post._id.toString())
        );

        const [seriesList, allPosts] = await Promise.all([
            Series.find({ _id: { $in: touchedSeriesIds } }, 'title slug'),
            Post.find({ series: { $in: touchedSeriesIds }, published: true }, 'title slug series seriesOrder').sort({
                seriesOrder: 1,
            }),
        ]);

        const summary = seriesList.map((series) => {
            const posts = allPosts.filter((p) => p.series.toString() === series._id.toString());
            const nextPost = posts.find((p) => !completedPostIds.has(p._id.toString())) || null;
            return {
                series,
                total: posts.length,
                completed: posts.filter((p) => completedPostIds.has(p._id.toString())).length,
                nextPost: nextPost ? { title: nextPost.title, slug: nextPost.slug } : null,
            };
        });

        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};
