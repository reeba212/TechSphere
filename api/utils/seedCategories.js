import Category from '../models/category.model.js';

export const DEFAULT_CATEGORIES = [
    { name: 'Web Development', slug: 'web-development', description: 'Frontend, backend and everything in between.' },
    { name: 'Machine Learning', slug: 'machine-learning', description: 'Models, training and the math behind them.' },
    { name: 'Data Science', slug: 'data-science', description: 'Analysis, statistics and visualization.' },
    { name: 'App Development', slug: 'app-development', description: 'Mobile and desktop application development.' },
    { name: 'Cloud Computing', slug: 'cloud-computing', description: 'Infrastructure, deployment and scaling.' },
    { name: 'Blockchain', slug: 'blockchain', description: 'Distributed ledgers and smart contracts.' },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Securing systems, networks and applications.' },
];

// Idempotent: only inserts categories that don't exist yet, never overwrites edits.
export const seedCategories = async () => {
    await Category.bulkWrite(
        DEFAULT_CATEGORIES.map((c) => ({
            updateOne: { filter: { slug: c.slug }, update: { $setOnInsert: c }, upsert: true },
        }))
    );
};
