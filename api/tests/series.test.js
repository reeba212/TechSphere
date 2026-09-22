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
const { default: Category } = await import('../models/category.model.js');
const { seedCategories } = await import('../utils/seedCategories.js');

let mongod;
let admin;
let reader;
let adminCookie;
let readerCookie;

const cookieFor = (user) =>
    `access_token=${jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET)}`;

const createPost = (body, cookie = adminCookie) =>
    request(app).post('/api/post/create').set('Cookie', cookie).send({ content: '<p>body</p>', published: true, ...body });

const createSeries = (body, cookie = adminCookie) =>
    request(app).post('/api/series/create').set('Cookie', cookie).send(body);

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Post.init(), Series.init(), Category.init()]);
    await seedCategories();
    admin = await User.create({ username: 'adminuser', email: 'a@x.com', password: 'x', isAdmin: true });
    reader = await User.create({ username: 'readeruser', email: 'r@x.com', password: 'x' });
    adminCookie = cookieFor(admin);
    readerCookie = cookieFor(reader);
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe('POST /api/series/create', () => {
    test('rejects non-admins', async () => {
        assert.equal((await request(app).post('/api/series/create').send({ title: 'React Basics' })).status, 401);
        assert.equal(
            (await createSeries({ title: 'React Basics' }, readerCookie)).status,
            403
        );
    });

    test('validates the body and unknown category', async () => {
        assert.equal((await createSeries({ title: 'ab' })).status, 400);
        assert.equal((await createSeries({ title: 'Valid Title', category: 'nope' })).status, 400);
    });

    test('creates a draft series with a unique slug', async () => {
        const res = await createSeries({ title: 'Learn React!', category: 'web-development' });
        assert.equal(res.status, 201);
        assert.equal(res.body.slug, 'learn-react');
        assert.equal(res.body.published, false);
    });
});

describe('series membership (PUT /api/series/:seriesId/posts)', () => {
    let series, p1, p2, p3;

    before(async () => {
        series = (await createSeries({ title: 'Membership Series', published: true })).body;
        p1 = (await createPost({ title: 'Member One' })).body;
        p2 = (await createPost({ title: 'Member Two' })).body;
        p3 = (await createPost({ title: 'Member Three' })).body;
    });

    test('non-admin cannot set membership', async () => {
        const res = await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', readerCookie)
            .send({ postIds: [p1._id] });
        assert.equal(res.status, 403);
    });

    test('rejects unknown post ids', async () => {
        const res = await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [String(new mongoose.Types.ObjectId())] });
        assert.equal(res.status, 400);
    });

    test('assigns seriesOrder by array position', async () => {
        const res = await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [p2._id, p1._id, p3._id] });
        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.map((p) => p.title),
            ['Member Two', 'Member One', 'Member Three']
        );
        assert.deepEqual(res.body.map((p) => p.seriesOrder), [1, 2, 3]);
    });

    test('re-setting membership drops posts left out and reorders the rest', async () => {
        const res = await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [p3._id, p1._id] });
        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.map((p) => p.title),
            ['Member Three', 'Member One']
        );

        const dropped = await Post.findById(p2._id);
        assert.equal(dropped.series, null);
        assert.equal(dropped.seriesOrder, null);
    });
});

describe('GET /api/series/:slug', () => {
    let series, p1, p2;

    before(async () => {
        series = (await createSeries({ title: 'Reading Series', published: true })).body;
        p1 = (await createPost({ title: 'Chapter One' })).body;
        p2 = (await createPost({ title: 'Chapter Two' })).body;
        await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [p1._id, p2._id] });
    });

    test('returns posts in series order with a completed flag per user', async () => {
        await request(app).put(`/api/progress/${p1._id}`).set('Cookie', readerCookie).send({ completed: true });

        const res = await request(app).get(`/api/series/${series.slug}`).set('Cookie', readerCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.posts.length, 2);
        assert.equal(res.body.posts[0].completed, true);
        assert.equal(res.body.posts[1].completed, false);
    });

    test('completed is false for a logged-out visitor', async () => {
        const res = await request(app).get(`/api/series/${series.slug}`);
        assert.equal(res.body.posts.every((p) => p.completed === false), true);
    });

    test('404 for an unpublished series shown to non-admins', async () => {
        const draft = (await createSeries({ title: 'Draft Series' })).body;
        assert.equal((await request(app).get(`/api/series/${draft.slug}`)).status, 404);
        assert.equal((await request(app).get(`/api/series/${draft.slug}`).set('Cookie', adminCookie)).status, 200);
    });
});

describe('GET /api/post/:slug seriesContext (prev/next navigation)', () => {
    test('reports position, prev and next within the series', async () => {
        const series = (await createSeries({ title: 'Nav Series', published: true })).body;
        const a = (await createPost({ title: 'Nav A' })).body;
        const b = (await createPost({ title: 'Nav B' })).body;
        const c = (await createPost({ title: 'Nav C' })).body;
        await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [a._id, b._id, c._id] });

        const res = await request(app).get(`/api/post/${b.slug}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.seriesContext.position, 2);
        assert.equal(res.body.seriesContext.total, 3);
        assert.equal(res.body.seriesContext.prev.slug, a.slug);
        assert.equal(res.body.seriesContext.next.slug, c.slug);
    });

    test('a post outside any series has no seriesContext', async () => {
        const res = await request(app).get('/api/post/member-two');
        assert.equal(res.body.seriesContext, undefined);
    });
});

describe('DELETE /api/series/:seriesId', () => {
    test('clears series membership from its posts', async () => {
        const series = (await createSeries({ title: 'Doomed Series', published: true })).body;
        const post = (await createPost({ title: 'Orphan Post' })).body;
        await request(app)
            .put(`/api/series/${series._id}/posts`)
            .set('Cookie', adminCookie)
            .send({ postIds: [post._id] });

        const res = await request(app).delete(`/api/series/${series._id}`).set('Cookie', adminCookie);
        assert.equal(res.status, 200);

        const cleared = await Post.findById(post._id);
        assert.equal(cleared.series, null);
    });
});
