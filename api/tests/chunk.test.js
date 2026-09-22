import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chunkArticle } from '../utils/chunk.js';

describe('chunkArticle', () => {
    test('empty content produces no chunks', () => {
        assert.deepEqual(chunkArticle(''), []);
        assert.deepEqual(chunkArticle('<p></p>'), []);
    });

    test('short article becomes a single chunk tagged with its heading', () => {
        const html = '<h1>Intro</h1><p>Hello world, this is a short article.</p>';
        const chunks = chunkArticle(html);
        assert.equal(chunks.length, 1);
        assert.equal(chunks[0].headingPath, 'Intro');
        assert.match(chunks[0].text, /Hello world/);
        assert.equal(chunks[0].position, 0);
    });

    test('content before the first heading has no heading path', () => {
        const html = '<p>Preamble text here.</p><h2>Section</h2><p>Body text.</p>';
        const chunks = chunkArticle(html);
        assert.equal(chunks[0].headingPath, null);
        assert.equal(chunks[1].headingPath, 'Section');
    });

    test('nested headings build a breadcrumb, and popping back down drops the child', () => {
        const html = '<h1>Guide</h1><h2>Setup</h2><p>a</p><h3>Install</h3><p>b</p><h2>Usage</h2><p>c</p>';
        const chunks = chunkArticle(html);
        const paths = chunks.map((c) => c.headingPath);
        assert.deepEqual(paths, ['Guide > Setup', 'Guide > Setup > Install', 'Guide > Usage']);
    });

    test('a long section is split into overlapping ~300-500 token chunks', () => {
        const words = Array.from({ length: 900 }, (_, i) => `word${i}`).join(' ');
        const html = `<h1>Long</h1><p>${words}</p>`;
        const chunks = chunkArticle(html);
        assert.ok(chunks.length >= 2);
        for (const c of chunks) {
            const n = c.text.split(' ').length;
            assert.ok(n <= 620, `chunk too long: ${n} words`); // generous upper bound incl. straggler merge
        }
        // consecutive chunks overlap
        const firstWords = chunks[0].text.split(' ');
        const secondWords = chunks[1].text.split(' ');
        assert.ok(secondWords.includes(firstWords[firstWords.length - 1]));
        chunks.forEach((c, i) => assert.equal(c.position, i));
    });
});
