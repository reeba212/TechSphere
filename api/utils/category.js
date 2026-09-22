import Category from '../models/category.model.js';

export const categoryExists = async (slug) =>
    slug === 'uncategorized' || Boolean(await Category.exists({ slug }));
