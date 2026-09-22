import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { validate } from '../utils/validate.js';
import { updateProgressSchema, listProgressQuerySchema } from '../validators/progress.validator.js';
import { upsert, list, seriesSummary } from '../controllers/progress.controller.js';

const router = express.Router();

router.get('/', verifyToken, validate(listProgressQuerySchema, 'query'), list);
router.get('/series-summary', verifyToken, seriesSummary);
router.put('/:postId', verifyToken, validate(updateProgressSchema), upsert);

export default router;
