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
const { default: Series } = await import('../models/series.model.js');
const { default: Progress } = await import('../models/progress.model.js');
const { default: Category } = await import('../models/category.model.js');
const { seedCategories } = await import('../utils/seedCategories.js');

let mongod;
let admin;
let reader;
let readerB;
let adminCookie;
let readerCookie;
let readerBCookie;

const cookieFor = (user) =>
    `access_token=${jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET)}`;

const createPost = (body, cookie = adminCookie) =>
    request(app).post('/api/post/create').set('Cookie', cookie).send({ content: '<p>body</p>', published: true, ...body });

const createSeries = (body, cookie = adminCookie) =>
    request(app).post('/api/series/create').set('Cookie', cookie).send(body);

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Post.init(), Series.init(), Progress.init(), Category.init()]);
    await seedCategories();
    admin = await User.create({ username: 'adminuser', email: 'a@x.com', password: 'x', isAdmin: true });
    reader = await User.create({ username: 'readeruser', email: 'r@x.com', password: 'x' });
    readerB = await User.create({ username: 'readerb', email: 'rb@x.com', password: 'x' });
    adminCookie = cookieFor(admin);
    readerCookie = cookieFor(reader);
    readerBCookie = cookieFor(readerB);
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('PUT /api/progress/:postId', () => {
    let post;
    before(async () => {
        post = (await createPost({ title: 'Progress Target' })).body;
    });

    test('requires auth', async () => {
        assert.equal((await request(app).put(`/api/progress/${post._id}`).send({ progressPercentage: 50 })).status, 401);
    });

    test('404 for a malformed or unknown post id', async () => {
        assert.equal((await request(app).put('/api/progress/not-an-id').set('Cookie', readerCookie).send({})).status, 404);
        assert.equal(
            (await request(app).put(`/api/progress/${new mongoose.Types.ObjectId()}`).set('Cookie', readerCookie).send({}))
                .status,
            404
        );
    });

    test('rejects out-of-range values', async () => {
        assert.equal(
            (await request(app).put(`/api/progress/${post._id}`).set('Cookie', readerCookie).send({ progressPercentage: 150 }))
                .status,
            400
        );
    });

    test('upserts on first write, updates in place on later writes, and is scoped per user', async () => {
        const first = await request(app)
            .put(`/api/progress/${post._id}`)
            .set('Cookie', readerCookie)
            .send({ progressPercentage: 20, lastReadPosition: 400 });
        assert.equal(first.status, 200);
        assert.equal(first.body.progressPercentage, 20);
        assert.equal(first.body.completed, false);

        const second = await request(app)
            .put(`/api/progress/${post._id}`)
            .set('Cookie', readerCookie)
            .send({ progressPercentage: 80 });
        assert.equal(second.body.progressPercentage, 80);
        assert.equal(second.body.lastReadPosition, 400); // untouched field keeps its previous value

        const count = await Progress.countDocuments({ user: reader._id, post: post._id });
        assert.equal(count, 1);

        const otherUser = await request(app)
            .put(`/api/progress/${post._id}`)
            .set('Cookie', readerBCookie)
            .send({ progressPercentage: 5 });
        assert.equal(otherUser.body.progressPercentage, 5);
    });

    test('marking complete sets completedAt; unmarking clears it', async () => {
        const done = await request(app).put(`/api/progress/${post._id}`).set('Cookie', readerCookie).send({ completed: true });
        assert.equal(done.body.completed, true);
        assert.notEqual(done.body.completedAt, null);

        const undone = await request(app)
            .put(`/api/progress/${post._id}`)
            .set('Cookie', readerCookie)
            .send({ completed: false });
        assert.equal(undone.body.completed, false);
        assert.equal(undone.body.completedAt, null);
    });
});

describe('GET /api/progress', () => {
    test('lists only the current user\'s progress, optionally filtered by completed', async () => {
        const p1 = (await createPost({ title: 'List Progress One' })).body;
        const p2 = (await createPost({ title: 'List Progress Two' })).body;
        await request(app).put(`/api/progress/${p1._id}`).set('Cookie', readerCookie).send({ completed: true });
        await request(app).put(`/api/progress/${p2._id}`).set('Cookie', readerCookie).send({ progressPercentage: 10 });

        const all = await request(app).get('/api/progress').set('Cookie', readerCookie);
        assert.equal(all.status, 200);
        assert.ok(all.body.length >= 2);
        assert.ok(all.body.every((p) => p.post));

        const completedOnly = await request(app).get('/api/progress?completed=true').set('Cookie', readerCookie);
        assert.ok(completedOnly.body.every((p) => p.completed === true));
    });
});

describe('GET /api/progress/series-summary', () => {
    test('reports completion counts and the next unread post per touched series', async () => {
        const series = (await createSeries({ title: 'Summary Series', published: true })).body;
        const a = (await createPost({ title: 'Summary A' })).body;
        const b = (await createPost({ title: 'Summary B' })).body;
        const c = (await createPost({ title: 'Summary C' })).body;
        await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [a._id, b._id, c._id] });

        await request(app).put(`/api/progress/${a._id}`).set('Cookie', readerBCookie).send({ completed: true });

        const res = await request(app).get('/api/progress/series-summary').set('Cookie', readerBCookie);
        assert.equal(res.status, 200);
        const entry = res.body.find((s) => s.series.slug === series.slug);
        assert.ok(entry);
        assert.equal(entry.total, 3);
        assert.equal(entry.completed, 1);
        assert.equal(entry.nextPost.slug, b.slug);
    });

    test('empty when the user has touched no series', async () => {
        const freshUser = await User.create({ username: 'freshuser', email: 'fresh@x.com', password: 'x' });
        const res = await request(app).get('/api/progress/series-summary').set('Cookie', cookieFor(freshUser));
        assert.deepEqual(res.body, []);
    });
});
