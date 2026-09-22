import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return next(errorHandler(401, 'Unauthorized'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return next(errorHandler(401, 'Unauthorized'));
        }
        req.user = user;
        next();
    });
};

// Sets req.user when a valid token is present, but never rejects the request.
// Used on public routes whose response differs for admins (e.g. drafts).
export const optionalAuth = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
    });
};

// Must run after verifyToken.
export const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, 'You are not allowed to do this'));
    }
    next();
};
