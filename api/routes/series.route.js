import express from 'express';
import { verifyToken, optionalAuth, requireAdmin } from '../utils/verifyUser.js';
import { validate } from '../utils/validate.js';
import {
    createSeriesSchema,
    updateSeriesSchema,
    listSeriesQuerySchema,
    setSeriesPostsSchema,
} from '../validators/series.validator.js';
import { create, list, getBySlug, update, remove, setPosts } from '../controllers/series.controller.js';

const router = express.Router();

router.get('/', optionalAuth, validate(listSeriesQuerySchema, 'query'), list);
router.get('/:slug', optionalAuth, getBySlug);

router.post('/create', verifyToken, requireAdmin, validate(createSeriesSchema), create);
router.put('/:seriesId/posts', verifyToken, requireAdmin, validate(setSeriesPostsSchema), setPosts);
router.put('/:seriesId', verifyToken, requireAdmin, validate(updateSeriesSchema), update);
router.delete('/:seriesId', verifyToken, requireAdmin, remove);

export default router;
