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
const { default: Bookmark } = await import('../models/bookmark.model.js');
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

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Post.init(), Bookmark.init(), Category.init()]);
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

describe('POST/DELETE /api/bookmarks/:postId', () => {
    let post;
    before(async () => {
        post = (await createPost({ title: 'Bookmark Target' })).body;
    });

    test('requires auth', async () => {
        assert.equal((await request(app).post(`/api/bookmarks/${post._id}`)).status, 401);
    });

    test('404 for an unknown post', async () => {
        const res = await request(app)
            .post(`/api/bookmarks/${new mongoose.Types.ObjectId()}`)
            .set('Cookie', readerCookie);
        assert.equal(res.status, 404);
    });

    test('adding twice is idempotent (no duplicate-key error)', async () => {
        const first = await request(app).post(`/api/bookmarks/${post._id}`).set('Cookie', readerCookie);
        const second = await request(app).post(`/api/bookmarks/${post._id}`).set('Cookie', readerCookie);
        assert.equal(first.status, 200);
        assert.equal(second.status, 200);
        const count = await Bookmark.countDocuments({ user: reader._id, post: post._id });
        assert.equal(count, 1);
    });

    test('removing is idempotent and scoped to the current user', async () => {
        const res = await request(app).delete(`/api/bookmarks/${post._id}`).set('Cookie', readerCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.bookmarked, false);
        const again = await request(app).delete(`/api/bookmarks/${post._id}`).set('Cookie', readerCookie);
        assert.equal(again.status, 200);
    });
});

describe('GET /api/bookmarks', () => {
    test('lists only the current user\'s bookmarked posts, newest first, without dangling refs', async () => {
        const p1 = (await createPost({ title: 'Bookmark One' })).body;
        const p2 = (await createPost({ title: 'Bookmark Two' })).body;
        const p3 = (await createPost({ title: 'Bookmark Three' })).body;

        await request(app).post(`/api/bookmarks/${p1._id}`).set('Cookie', readerCookie);
        await request(app).post(`/api/bookmarks/${p2._id}`).set('Cookie', readerCookie);
        await request(app).post(`/api/bookmarks/${p3._id}`).set('Cookie', adminCookie); // different user

        const res = await request(app).get('/api/bookmarks').set('Cookie', readerCookie);
        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.posts.map((p) => p.title),
            ['Bookmark Two', 'Bookmark One']
        );
        assert.equal(res.body.posts[0].content, undefined);

        await request(app).delete(`/api/post/${p1._id}`).set('Cookie', adminCookie);
        const afterDelete = await request(app).get('/api/bookmarks').set('Cookie', readerCookie);
        assert.deepEqual(
            afterDelete.body.posts.map((p) => p.title),
            ['Bookmark Two']
        );
    });
});
