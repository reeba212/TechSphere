import { errorHandler } from './error.js';

// validate(schema, 'body' | 'query'): on success the parsed (whitelisted, coerced)
// data is available as req.validated[source]. Raw req.body/req.query are left alone.
export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const message = result.error.issues
            .map((i) => `${i.path.join('.') || source}: ${i.message}`)
            .join('; ');
        return next(errorHandler(400, message));
    }
    req.validated = { ...(req.validated || {}), [source]: result.data };
    next();
};
