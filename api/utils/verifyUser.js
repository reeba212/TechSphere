import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js'; // Make sure to import errorHandler

export const verifyToken = (req, res, next) => {
    console.log("🔍 Verifying Token...");

    const token = req.cookies.access_token;
    console.log("🍪 Access Token from Cookie:", token);

    if (!token) {
        console.log("No Token Found");
        return next(errorHandler(401, 'Unauthorized'));
    }

    console.log("🛡️ JWT Secret Key:", process.env.JWT_SECRET);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token Verification Failed:", err.message);
            return next(errorHandler(401, 'Unauthorized'));
        }

        console.log("Token Verified! User:", user);
        req.user = user;
        next();
    });
};
