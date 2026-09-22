import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { aiRateLimit } from '../utils/aiRateLimit.js';

const fakeReqRes = (userId) => {
    const req = { user: userId ? { id: userId } : undefined, ip: '127.0.0.1' };
    const res = { headers: {}, set(k, v) { this.headers[k] = v; } };
    return { req, res };
};

describe('aiRateLimit', () => {
    test('allows up to max requests then 429s', () => {
        const limit = aiRateLimit(2, 60_000);
        const { req, res } = fakeReqRes('user-a');
        let calls = 0;
        const next = (err) => { if (!err) calls++; else assert.equal(err.statusCode, 429); };

        limit(req, res, next);
        limit(req, res, next);
        limit(req, res, next);

        assert.equal(calls, 2);
        assert.ok(res.headers['Retry-After']);
    });

    test('keys are independent per user', () => {
        const limit = aiRateLimit(1, 60_000);
        const a = fakeReqRes('user-a');
        const b = fakeReqRes('user-b');
        let allowed = 0;
        const next = (err) => { if (!err) allowed++; };

        limit(a.req, a.res, next);
        limit(b.req, b.res, next);

        assert.equal(allowed, 2);
    });

    test('resets after the window elapses', async () => {
        const limit = aiRateLimit(1, 20);
        const { req, res } = fakeReqRes('user-c');
        let allowed = 0;
        const next = (err) => { if (!err) allowed++; };

        limit(req, res, next);
        await new Promise((r) => setTimeout(r, 30));
        limit(req, res, next);

        assert.equal(allowed, 2);
    });
});
