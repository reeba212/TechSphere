import { z } from 'zod';

const tags = z
    .array(z.string().trim().toLowerCase().min(1).max(30))
    .max(8)
    .transform((arr) => [...new Set(arr)]);

const imageUrl = z.union([z.literal(''), z.string().url().max(2000)]);

export const createPostSchema = z.object({
    title: z.string().trim().min(3).max(150),
    content: z.string().min(1),
    excerpt: z.string().trim().max(300).optional(),
    coverImage: imageUrl.optional(),
    category: z.string().trim().min(1).max(60).optional(),
    tags: tags.optional(),
    published: z.boolean().optional(),
});

// Every field optional on update. Unknown keys (slug, author, isAdmin...) are stripped.
export const updatePostSchema = createPostSchema.partial();

export const listPostsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(9),
    category: z.string().trim().optional(),
    tag: z.string().trim().toLowerCase().optional(),
    q: z.string().trim().max(100).optional(),
    sort: z.enum(['newest', 'oldest', 'relevance']).default('newest'),
    published: z.enum(['true', 'false', 'all']).optional(),
});
