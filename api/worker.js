import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { AI_QUEUE_NAME } from './queue/aiQueue.js';
import { getRedisConnection } from './queue/connection.js';
import { processAiJob } from './queue/processors.js';

dotenv.config();

// Runs as a second process/entry point alongside the API (Render free tier has
// no separate background-worker service, see docs/BUILD_PLAN.md section 1).
mongoose.connect(process.env.MONGO)
    .then(() => console.log('[worker] MongoDB is connected'))
    .catch((err) => {
        console.error('[worker] MongoDB connection failed', err);
        process.exit(1);
    });

const worker = new Worker(AI_QUEUE_NAME, processAiJob, {
    connection: getRedisConnection(),
    concurrency: 1, // stay well under the Gemini free-tier requests-per-minute cap
});

worker.on('completed', (job) => console.log(`[worker] ${job.name} done for post ${job.data.postId}`));
worker.on('failed', (job, err) => console.error(`[worker] ${job?.name} failed for post ${job?.data?.postId}:`, err.message));

const shutdown = async () => {
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
