import IORedis from 'ioredis';

let connection = null;

// Shared between the queue producer (api process) and the worker process.
// BullMQ requires maxRetriesPerRequest: null on the ioredis connection it owns.
export const getRedisConnection = () => {
    if (!connection) {
        if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set');
        connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    }
    return connection;
};
