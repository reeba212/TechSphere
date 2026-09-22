import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createSeriesSchema = z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(1000).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    published: z.boolean().optional(),
});

// Every field optional on update. Unknown keys (slug...) are stripped.
export const updateSeriesSchema = createSeriesSchema.partial();

export const listSeriesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    published: z.enum(['true', 'false', 'all']).optional(),
});

// Full ordered membership list: posts not included are removed from the series (D4).
export const setSeriesPostsSchema = z.object({
    postIds: z.array(objectId).max(200),
});
