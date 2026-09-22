import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-only-secret';

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/user.model.js');
const { default: Post } = await import('../models/post.model.js');
const { default: Chunk } = await import('../models/chunk.model.js');
const { default: Category } = await import('../models/category.model.js');
const { seedCategories } = await import('../utils/seedCategories.js');
const { aiClient } = await import('../utils/aiClient.js');

let mongod;
let admin, reader;
let adminCookie, readerCookie;
let post;

const cookieFor = (user) =>
    `access_token=${jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET)}`;

// A fake vectorSearch hit shaped like the real aggregation's output (see ai.controller.js).
const hit = (overrides = {}) => ({
    text: 'React hooks let you use state in function components.',
    headingPath: 'Hooks',
    score: 0.82,
    post: { _id: post._id, title: post.title, slug: post.slug },
    ...overrides,
});

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Post.init(), Chunk.init(), Category.init()]);
    await seedCategories();
    admin = await User.create({ username: 'adminuser', email: 'a@x.com', password: 'x', isAdmin: true });
    reader = await User.create({ username: 'readeruser', email: 'r@x.com', password: 'x' });
    adminCookie = cookieFor(admin);
    readerCookie = cookieFor(reader);
    post = await Post.create({
        title: 'React Hooks 101', slug: 'react-hooks-101', content: '<h2>Hooks</h2><p>Body</p>',
        published: true, author: admin._id,
    });
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('POST /api/ai/ask', () => {
    test('rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/ai/ask').send({ question: 'What are hooks?' });
        assert.equal(res.status, 401);
    });

    test('validates the question length', async () => {
        const res = await request(app).post('/api/ai/ask').set('Cookie', readerCookie).send({ question: 'hi' });
        assert.equal(res.status, 400);
    });

    test('guardrail: says so when nothing relevant is retrieved', async (t) => {
        t.mock.method(aiClient, 'embedBatch', async () => [[0.1]]);
        t.mock.method(Chunk, 'aggregate', async () => []);
        const generateMock = t.mock.method(aiClient, 'generate', async () => 'should not be called');

        const res = await request(app).post('/api/ai/ask').set('Cookie', readerCookie).send({ question: 'What is quantum computing?' });

        assert.equal(res.status, 200);
        assert.equal(res.body.sources.length, 0);
        assert.match(res.body.answer, /couldn't find/i);
        assert.equal(generateMock.mock.callCount(), 0);
    });

    test('answers with sources when retrieval finds relevant chunks', async (t) => {
        t.mock.method(aiClient, 'embedBatch', async () => [[0.1]]);
        t.mock.method(Chunk, 'aggregate', async () => [hit()]);
        t.mock.method(aiClient, 'generate', async ({ prompt }) => {
            assert.match(prompt, /React hooks let you use state/);
            return 'Hooks let you use state in function components.';
        });

        const res = await request(app).post('/api/ai/ask').set('Cookie', readerCookie).send({ question: 'What are hooks?' });

        assert.equal(res.status, 200);
        assert.equal(res.body.answer, 'Hooks let you use state in function components.');
        assert.equal(res.body.sources.length, 1);
        assert.equal(res.body.sources[0].slug, 'react-hooks-101');
    });

    test('scopes retrieval to a specific post when postId is given', async (t) => {
        t.mock.method(aiClient, 'embedBatch', async () => [[0.1]]);
        const aggregateMock = t.mock.method(Chunk, 'aggregate', async () => [hit()]);
        t.mock.method(aiClient, 'generate', async () => 'answer');

        await request(app).post('/api/ai/ask').set('Cookie', readerCookie).send({ question: 'What are hooks?', postId: String(post._id) });

        const pipeline = aggregateMock.mock.calls[0].arguments[0];
        const vectorStage = pipeline.find((s) => s.$vectorSearch);
        const filterIds = vectorStage.$vectorSearch.filter.post.$in.map(String);
        assert.deepEqual(filterIds, [String(post._id)]);
    });
});

describe('POST /api/ai/explain', () => {
    test('rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/ai/explain').send({ postId: post._id, mode: 'eli5' });
        assert.equal(res.status, 401);
    });

    test('rejects an invalid mode', async () => {
        const res = await request(app).post('/api/ai/explain').set('Cookie', readerCookie).send({ postId: post._id, mode: 'nope' });
        assert.equal(res.status, 400);
    });

    test('404s for an unknown post', async () => {
        const res = await request(app).post('/api/ai/explain').set('Cookie', readerCookie)
            .send({ postId: new mongoose.Types.ObjectId(), mode: 'eli5' });
        assert.equal(res.status, 404);
    });

    test('returns the generated explanation', async (t) => {
        t.mock.method(aiClient, 'generate', async ({ prompt }) => {
            assert.match(prompt, /React Hooks 101/);
            return 'Simple explanation.';
        });

        const res = await request(app).post('/api/ai/explain').set('Cookie', readerCookie)
            .send({ postId: post._id, mode: 'eli5', selection: 'useState lets you add state.' });

        assert.equal(res.status, 200);
        assert.equal(res.body.answer, 'Simple explanation.');
    });
});

describe('GET /api/search/semantic', () => {
    test('validates the query', async () => {
        const res = await request(app).get('/api/search/semantic?q=ab');
        assert.equal(res.status, 400);
    });

    test('dedupes to the best chunk per post and respects limit', async (t) => {
        const otherPostId = new mongoose.Types.ObjectId();
        t.mock.method(aiClient, 'embedBatch', async () => [[0.1]]);
        t.mock.method(Chunk, 'aggregate', async () => [
            hit({ score: 0.9 }),
            hit({ score: 0.7 }), // same post, lower score -> dropped
            hit({ score: 0.8, post: { _id: otherPostId, title: 'Other', slug: 'other' } }),
        ]);

        const res = await request(app).get('/api/search/semantic?q=react+hooks&limit=5');

        assert.equal(res.status, 200);
        assert.equal(res.body.length, 2);
        assert.equal(res.body[0].score, 0.9);
    });
});
