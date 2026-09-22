import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const semanticSearchQuerySchema = z.object({
    q: z.string().trim().min(3).max(300),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const askSchema = z.object({
    question: z.string().trim().min(3).max(500),
    postId: objectId.optional(),
    seriesId: objectId.optional(),
});

export const EXPLAIN_MODES = ['explain', 'eli5', 'example', 'explain_code'];

export const explainSchema = z.object({
    postId: objectId,
    mode: z.enum(EXPLAIN_MODES),
    selection: z.string().trim().max(2000).optional(),
});
