import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';
import Bookmark from '../models/bookmark.model.js';
import Post from '../models/post.model.js';

const AUTHOR_FIELDS = 'username profilePicture';

export const add = async (req, res, next) => {
    try {
        const { postId } = req.params;
        if (!mongoose.isValidObjectId(postId) || !(await Post.exists({ _id: postId }))) {
            return next(errorHandler(404, 'Post not found'));
        }
        await Bookmark.updateOne(
            { user: req.user.id, post: postId },
            { $setOnInsert: { user: req.user.id, post: postId } },
            { upsert: true }
        );
        res.status(200).json({ bookmarked: true });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await Bookmark.deleteOne({ user: req.user.id, post: req.params.postId });
        res.status(200).json({ bookmarked: false });
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const { page, limit } = req.validated.query;
        const filter = { user: req.user.id };

        const [bookmarks, total] = await Promise.all([
            Bookmark.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({ path: 'post', select: '-content', populate: { path: 'author', select: AUTHOR_FIELDS } }),
            Bookmark.countDocuments(filter),
        ]);

        // A post can be deleted after being bookmarked; drop those dangling entries.
        const posts = bookmarks.filter((b) => b.post).map((b) => b.post);
        res.status(200).json({ posts, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};
