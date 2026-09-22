import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import categoryRoutes from './routes/category.route.js';
import uploadRoutes from './routes/upload.route.js';
import seriesRoutes from './routes/series.route.js';
import progressRoutes from './routes/progress.route.js';
import bookmarkRoutes from './routes/bookmark.route.js';

// The Express app, with no side effects (no DB connection, no listening) so tests can import it.
const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.use((req, res, next) => {
    res.status(404).json({ success: false, statusCode: 404, message: 'Not found' });
});

app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern || {})[0] || 'value';
        message = `A record with this ${field} already exists`;
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON body';
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request body is too large';
    }

    res.status(statusCode).json({ success: false, statusCode, message });
});

export default app;
