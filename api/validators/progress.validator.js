import { z } from 'zod';

export const updateProgressSchema = z.object({
    progressPercentage: z.number().min(0).max(100).optional(),
    lastReadPosition: z.number().min(0).optional(),
    completed: z.boolean().optional(),
});

export const listProgressQuerySchema = z.object({
    completed: z.enum(['true', 'false']).optional(),
});
