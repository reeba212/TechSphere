import express from 'express';
import { validate } from '../utils/validate.js';
import { aiRateLimit } from '../utils/aiRateLimit.js';
import { semanticSearchQuerySchema } from '../validators/ai.validator.js';
import { semanticSearch } from '../controllers/ai.controller.js';

const router = express.Router();

// Public (like text search), but still rate-limited since it calls the embedding model.
router.get('/semantic', aiRateLimit(30, 10 * 60 * 1000), validate(semanticSearchQuerySchema, 'query'), semanticSearch);

export default router;
