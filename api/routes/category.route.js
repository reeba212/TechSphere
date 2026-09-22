import express from 'express';
import Category from '../models/category.model.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
});

export default router;
