import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { validate } from '../utils/validate.js';
import { aiRateLimit } from '../utils/aiRateLimit.js';
import { askSchema, explainSchema } from '../validators/ai.validator.js';
import { ask, explain } from '../controllers/ai.controller.js';

const router = express.Router();

// Interactive AI endpoints: any signed-in reader, rate-limited to protect the free Gemini quota.
router.post('/ask', verifyToken, aiRateLimit(20, 10 * 60 * 1000), validate(askSchema), ask);
router.post('/explain', verifyToken, aiRateLimit(20, 10 * 60 * 1000), validate(explainSchema), explain);

export default router;
