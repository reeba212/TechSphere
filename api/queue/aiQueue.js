import { Queue } from 'bullmq';
import { getRedisConnection } from './connection.js';

export const AI_QUEUE_NAME = 'ai-jobs';
export const JOB_SUMMARIZE = 'summarize';
export const JOB_EMBED = 'embed';

let queue = null;

// Lazily created so importing this module never opens a Redis connection
// (matters for tests, which don't run a worker/Redis at all).
const getQueue = () => {
    if (!queue) {
        queue = new Queue(AI_QUEUE_NAME, {
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { count: 200 },
                removeOnFail: { count: 500 },
            },
        });
    }
    return queue;
};

// Enqueued after a post's content becomes published (create, or update while
// published, D-per Sprint 3 goal). Runs in the worker, never inline in a request.
export const enqueuePostJobs = async (postId) => {
    if (!process.env.REDIS_URL) {
        console.warn('[ai queue] REDIS_URL not set, skipping enqueue (dev/test without a worker)');
        return;
    }
    const q = getQueue();
    await Promise.all([
        q.add(JOB_SUMMARIZE, { postId: String(postId) }),
        q.add(JOB_EMBED, { postId: String(postId) }),
    ]);
};
