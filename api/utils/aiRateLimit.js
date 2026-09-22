import { errorHandler } from './error.js';

// Simple in-memory fixed-window limiter, keyed by user id (falls back to IP for
// anonymous search). Good enough for a single-instance free-tier deployment;
// protects the Gemini free quota from being exhausted by one client.
// Each call gets its own counter map, so separate routes have independent budgets.
export const aiRateLimit = (max, windowMs) => {
    const hits = new Map(); // key -> { count, resetAt }

    return (req, res, next) => {
        const key = req.user?.id || req.ip;
        const now = Date.now();
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        if (entry.count >= max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return next(errorHandler(429, 'Too many AI requests, please try again shortly'));
        }
        entry.count += 1;
        next();
    };
};
