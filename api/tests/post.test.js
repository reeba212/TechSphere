import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Throwaway secret: tests never touch the real environment or database.
process.env.JWT_SECRET = 'test-only-secret';

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/user.model.js');
const { default: Post } = await import('../models/post.model.js');
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
    request(app).post('/api/post/create').set('Cookie', cookie).send(body);

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Post.init(), Category.init()]);
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

describe('categories', () => {
    test('seed is idempotent and list is public', async () => {
        await seedCategories();
        const res = await request(app).get('/api/category');
        assert.equal(res.status, 200);
        assert.equal(res.body.length, 7);
    });
});

describe('POST /api/post/create', () => {
    test('rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/post/create').send({ title: 'Hello there', content: '<p>x</p>' });
        assert.equal(res.status, 401);
    });

    test('rejects non-admins even if they send isAdmin in the body', async () => {
        const res = await createPost({ title: 'Sneaky post', content: '<p>x</p>', isAdmin: true }, readerCookie);
        assert.equal(res.status, 403);
    });

    test('validates the body', async () => {
        const res = await createPost({ title: 'ab', content: '' });
        assert.equal(res.status, 400);
    });

    test('rejects empty editor content and unknown categories', async () => {
        const empty = await createPost({ title: 'Empty article', content: '<p><br></p>' });
        assert.equal(empty.status, 400);
        const badCat = await createPost({ title: 'Bad category', content: '<p>hi</p>', category: 'nope' });
        assert.equal(badCat.status, 400);
    });

    test('creates a draft with slug, excerpt, read time and author from the token', async () => {
        const res = await createPost({
            title: 'Intro to React Hooks!',
            content: '<h2>Hooks</h2><p>useState lets you keep state.</p>',
            category: 'web-development',
            tags: ['React', 'react', 'hooks'],
            userId: 'attacker',
            slug: 'evil-slug',
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.slug, 'intro-to-react-hooks');
        assert.equal(res.body.published, false);
        assert.equal(res.body.author, String(admin._id));
        assert.deepEqual(res.body.tags, ['react', 'hooks']);
        assert.equal(res.body.readTimeMins, 1);
        assert.match(res.body.excerpt, /Hooks useState lets you keep state\./);
        assert.equal(res.body.userId, undefined);
    });

    test('handles slug collisions from titles that slugify identically', async () => {
        const a = await createPost({ title: 'Hello, World', content: '<p>a</p>', published: true });
        const b = await createPost({ title: 'Hello World!', content: '<p>b</p>', published: true });
        assert.equal(a.body.slug, 'hello-world');
        assert.equal(b.body.slug, 'hello-world-2');
    });

    test('returns 409 for a duplicate title', async () => {
        await createPost({ title: 'Unique Title', content: '<p>a</p>' });
        const res = await createPost({ title: 'Unique Title', content: '<p>b</p>' });
        assert.equal(res.status, 409);
    });

    test('sanitizes dangerous HTML but keeps editor formatting', async () => {
        const res = await createPost({
            title: 'XSS attempt',
            content:
                '<p onclick="steal()">hi<script>alert(1)</script></p>' +
                '<a href="javascript:alert(1)">bad</a>' +
                '<img src="x" onerror="alert(1)">' +
                '<iframe src="https://evil.example"></iframe>' +
                '<div class="ql-code-block-container"><div class="ql-code-block">const a = 1;</div></div>' +
                '<ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>item</li></ol>',
        });
        assert.equal(res.status, 201);
        const html = res.body.content;
        assert.doesNotMatch(html, /script|onclick|onerror|javascript:|iframe/i);
        assert.match(html, /ql-code-block-container/);
        assert.match(html, /data-list="bullet"/);
    });
});

describe('GET /api/post', () => {
    before(async () => {
        await Post.deleteMany({});
        const make = (title, extra) => createPost({ title, content: `<p>${title} body about databases</p>`, ...extra });
        await make('Alpha React', { category: 'web-development', tags: ['react'], published: true });
        await make('Beta Neural Nets', { category: 'machine-learning', tags: ['ml'], published: true });
        await make('Gamma React Router', { category: 'web-development', tags: ['react', 'router'], published: true });
        await make('Delta Draft', { category: 'web-development', published: false });
    });

    test('public listing hides drafts and content, and paginates', async () => {
        const res = await request(app).get('/api/post?limit=2&page=1');
        assert.equal(res.status, 200);
        assert.equal(res.body.total, 3);
        assert.equal(res.body.pages, 2);
        assert.equal(res.body.posts.length, 2);
        assert.equal(res.body.posts[0].content, undefined);
        assert.equal(res.body.posts[0].author.username, 'adminuser');
        assert.equal(res.body.posts[0].title, 'Gamma React Router'); // newest first
        const page2 = await request(app).get('/api/post?limit=2&page=2');
        assert.equal(page2.body.posts.length, 1);
    });

    test('a non-admin cannot list drafts even with published=all', async () => {
        const res = await request(app).get('/api/post?published=all').set('Cookie', readerCookie);
        assert.equal(res.body.total, 3);
    });

    test('admin can list drafts explicitly, but the default stays published-only', async () => {
        const all = await request(app).get('/api/post?published=all').set('Cookie', adminCookie);
        assert.equal(all.body.total, 4);
        const drafts = await request(app).get('/api/post?published=false').set('Cookie', adminCookie);
        assert.equal(drafts.body.total, 1);
        const def = await request(app).get('/api/post').set('Cookie', adminCookie);
        assert.equal(def.body.total, 3);
    });

    test('filters by category and tag, and sorts oldest first', async () => {
        const cat = await request(app).get('/api/post?category=machine-learning');
        assert.deepEqual(cat.body.posts.map((p) => p.title), ['Beta Neural Nets']);
        const tag = await request(app).get('/api/post?tag=router');
        assert.deepEqual(tag.body.posts.map((p) => p.title), ['Gamma React Router']);
        const oldest = await request(app).get('/api/post?sort=oldest');
        assert.equal(oldest.body.posts[0].title, 'Alpha React');
    });

    test('text search ranks by relevance and ignores drafts', async () => {
        const res = await request(app).get('/api/post?q=react&sort=relevance');
        assert.equal(res.body.total, 2);
        const none = await request(app).get('/api/post?q=draft');
        assert.equal(none.body.total, 0);
    });

    test('rejects bad query params', async () => {
        const res = await request(app).get('/api/post?limit=1000');
        assert.equal(res.status, 400);
    });
});

describe('GET /api/post/:slug', () => {
    test('returns a published post with content', async () => {
        const res = await request(app).get('/api/post/alpha-react');
        assert.equal(res.status, 200);
        assert.match(res.body.content, /databases/);
    });

    test('hides drafts from the public and non-admins, shows them to admins', async () => {
        assert.equal((await request(app).get('/api/post/delta-draft')).status, 404);
        assert.equal((await request(app).get('/api/post/delta-draft').set('Cookie', readerCookie)).status, 404);
        assert.equal((await request(app).get('/api/post/delta-draft').set('Cookie', adminCookie)).status, 200);
    });

    test('404 for unknown slug', async () => {
        assert.equal((await request(app).get('/api/post/nope')).status, 404);
    });

    test('related posts share category or tags, exclude self and drafts', async () => {
        const res = await request(app).get('/api/post/alpha-react/related');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.map((p) => p.title), ['Gamma React Router']);
    });
});

describe('PUT/DELETE /api/post/:postId', () => {
    let post;
    before(async () => {
        post = (await createPost({ title: 'Editable', content: '<p>old</p>', published: false })).body;
    });

    test('non-admins cannot update or delete', async () => {
        assert.equal((await request(app).put(`/api/post/${post._id}`).set('Cookie', readerCookie).send({ title: 'x1x' })).status, 403);
        assert.equal((await request(app).delete(`/api/post/${post._id}`).set('Cookie', readerCookie)).status, 403);
    });

    test('admin updates content, refreshing excerpt and read time; slug and author are immutable', async () => {
        const words = Array(450).fill('word').join(' ');
        const res = await request(app)
            .put(`/api/post/${post._id}`)
            .set('Cookie', adminCookie)
            .send({ title: 'Edited Title', content: `<p>${words}</p>`, published: true, slug: 'hacked', author: reader._id });
        assert.equal(res.status, 200);
        assert.equal(res.body.title, 'Edited Title');
        assert.equal(res.body.slug, 'editable');
        assert.equal(res.body.author, String(admin._id));
        assert.equal(res.body.published, true);
        assert.equal(res.body.readTimeMins, 3);
        assert.match(res.body.excerpt, /^word word/);
    });

    test('404 for a malformed or unknown id', async () => {
        assert.equal((await request(app).put('/api/post/not-an-id').set('Cookie', adminCookie).send({ title: 'valid title' })).status, 404);
        assert.equal((await request(app).delete(`/api/post/${new mongoose.Types.ObjectId()}`).set('Cookie', adminCookie)).status, 404);
    });

    test('admin can delete', async () => {
        const res = await request(app).delete(`/api/post/${post._id}`).set('Cookie', adminCookie);
        assert.equal(res.status, 200);
        assert.equal((await request(app).get('/api/post/editable')).status, 404);
    });
});

describe('POST /api/upload/image', () => {
    test('requires an admin', async () => {
        assert.equal((await request(app).post('/api/upload/image')).status, 401);
        assert.equal((await request(app).post('/api/upload/image').set('Cookie', readerCookie)).status, 403);
    });

    test('rejects missing file and non-image files', async () => {
        const none = await request(app).post('/api/upload/image').set('Cookie', adminCookie);
        assert.equal(none.status, 400);
        const bad = await request(app)
            .post('/api/upload/image')
            .set('Cookie', adminCookie)
            .attach('image', Buffer.from('not an image'), { filename: 'a.txt', contentType: 'text/plain' });
        assert.equal(bad.status, 400);
    });
});
