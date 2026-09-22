import express from 'express';
import { verifyToken, optionalAuth, requireAdmin } from '../utils/verifyUser.js';
import { validate } from '../utils/validate.js';
import { createPostSchema, updatePostSchema, listPostsQuerySchema } from '../validators/post.validator.js';
import { create, list, getBySlug, related, update, remove } from '../controllers/post.controller.js';

const router = express.Router();

router.get('/', optionalAuth, validate(listPostsQuerySchema, 'query'), list);
router.get('/:slug/related', optionalAuth, related);
router.get('/:slug', optionalAuth, getBySlug);

router.post('/create', verifyToken, requireAdmin, validate(createPostSchema), create);
router.put('/:postId', verifyToken, requireAdmin, validate(updatePostSchema), update);
router.delete('/:postId', verifyToken, requireAdmin, remove);

export default router;
