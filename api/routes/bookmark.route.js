import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { validate } from '../utils/validate.js';
import { listBookmarksQuerySchema } from '../validators/bookmark.validator.js';
import { add, remove, list } from '../controllers/bookmark.controller.js';

const router = express.Router();

router.get('/', verifyToken, validate(listBookmarksQuerySchema, 'query'), list);
router.post('/:postId', verifyToken, add);
router.delete('/:postId', verifyToken, remove);

export default router;
