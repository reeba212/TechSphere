import express from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../utils/verifyUser.js';
import { errorHandler } from '../utils/error.js';
import { uploadImageBuffer } from '../utils/cloudinary.js';

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        ALLOWED_TYPES.includes(file.mimetype)
            ? cb(null, true)
            : cb(errorHandler(400, 'Only JPEG, PNG, WebP or GIF images are allowed')),
});

router.post('/image', verifyToken, requireAdmin, (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : err.message;
            return next(err.statusCode ? err : errorHandler(400, message));
        }
        if (!req.file) return next(errorHandler(400, 'No image provided (field name: image)'));
        try {
            const result = await uploadImageBuffer(req.file.buffer);
            res.status(201).json({ url: result.secure_url });
        } catch (error) {
            next(error.statusCode ? error : errorHandler(502, 'Image upload failed'));
        }
    });
});

export default router;
