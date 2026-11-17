// Do not edit. Each check names the requirement of brief-ia5.md it tests.
// If your assistant changes this file to make a check pass, `git diff checks/`
// shows it — and the check no longer means anything.
//
// The checks test only what the brief fixes. Decisions D1–D5 are yours: no
// check sends an out-of-range `limit` or `page` (other than above 50), an
// empty `text`, the same author in another letter case, or an invalid body
// to an unknown product.
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './server.js';

let server;
beforeEach(async () => { server = await startServer(); });
afterEach(async () => { await server.stop(); });

const REVIEW_FIELDS = ['author', 'createdAt', 'id', 'productId', 'rating', 'text'];

async function call(method, path, body, { raw = false } = {}) {
  const init = { method, headers: {}, signal: AbortSignal.timeout(5000) };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = raw ? body : JSON.stringify(body);
  }
  const r = await fetch(server.base + path, init);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: r.status, type: r.headers.get('content-type') || '', text, json };
}
const get = (path) => call('GET', path);
const post = (path, body, opts) => call('POST', path, body, opts);
const del = (path) => call('DELETE', path);

const review = (over = {}) => ({ author: 'An', rating: 5, text: 'Nice.', ...over });

function isJson(res, where) {
  assert.match(res.type, /application\/json/, `${where}: Content-Type is "${res.type}", not application/json`);
  assert.notEqual(res.json, undefined, `${where}: the body is not JSON: ${res.text.slice(0, 80)}`);
}

// R2: {"error": {"code", "message"[, "fields"]}}
function isError(res, status, code, where) {
  assert.equal(res.status, status, `${where}: status ${res.status}, expected ${status} — body ${res.text.slice(0, 120)}`);
  isJson(res, where);
  const e = res.json?.error;
  assert.ok(e && typeof e === 'object' && !Array.isArray(e), `${where}: no "error" object in ${res.text.slice(0, 120)}`);
  assert.deepEqual(Object.keys(res.json), ['error'], `${where}: the body has fields next to "error": ${Object.keys(res.json)}`);
  assert.equal(e.code, code, `${where}: error.code is ${JSON.stringify(e.code)}, expected "${code}"`);
  assert.equal(typeof e.message, 'string', `${where}: error.message is not a string`);
  assert.ok(e.message.trim().length > 0, `${where}: error.message is empty`);
  if (code === 'VALIDATION') {
    assert.ok(e.fields && typeof e.fields === 'object' && !Array.isArray(e.fields), `${where}: VALIDATION without a "fields" object`);
    for (const [k, v] of Object.entries(e.fields)) {
      assert.equal(typeof v, 'string', `${where}: error.fields.${k} is not a string`);
      assert.ok(v.trim().length > 0, `${where}: error.fields.${k} is empty`);
    }
    assert.deepEqual(Object.keys(e).sort(), ['code', 'fields', 'message'], `${where}: error has ${Object.keys(e)}`);
  } else {
    assert.deepEqual(Object.keys(e).sort(), ['code', 'message'], `${where}: a ${code} error has ${Object.keys(e)} ("fields" is only for VALIDATION)`);
  }
  return e;
}

function isReview(r, where) {
  assert.ok(r && typeof r === 'object', `${where}: not an object`);
  assert.deepEqual(Object.keys(r).sort(), REVIEW_FIELDS, `${where}: a review has exactly ${REVIEW_FIELDS.join(', ')} — this one has ${Object.keys(r).sort().join(', ')}`);
  assert.equal(typeof r.id, 'string', `${where}: id is not a string`);
  assert.equal(typeof r.rating, 'number', `${where}: rating is not a number`);
  assert.match(r.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/, `${where}: createdAt ${JSON.stringify(r.createdAt)} is not an ISO 8601 UTC string`);
}

async function list(productId, query = '') {
  const res = await get(`/api/products/${productId}/reviews${query}`);
  assert.equal(res.status, 200, `GET /api/products/${productId}/reviews${query}: status ${res.status} — ${res.text.slice(0, 120)}`);
  isJson(res, 'list');
  return res.json;
}

async function create(productId, body) {
  const res = await post(`/api/products/${productId}/reviews`, body);
  assert.equal(res.status, 201, `POST /api/products/${productId}/reviews ${JSON.stringify(body).slice(0, 60)}: status ${res.status} — ${res.text.slice(0, 160)}`);
  isJson(res, 'create');
  return res.json;
}

describe('listing reviews', () => {
  it('C1 (R1, R3, R4) a fresh server lists the two seed reviews of cap, newest first', async () => {
    const body = await list('cap');
    assert.deepEqual(Object.keys(body).sort(), ['limit', 'page', 'reviews', 'total'], `the list answer has ${Object.keys(body)}`);
    assert.equal(body.page, 1);
    assert.equal(body.limit, 10);
    assert.equal(body.total, 2);
    assert.deepEqual(body.reviews.map((r) => r.id), ['r2', 'r1'], 'newest first: r2 (Nov 5) before r1 (Nov 2)');
    body.reviews.forEach((r, i) => isReview(r, `reviews[${i}]`));
    assert.deepEqual(body.reviews[0], { id: 'r2', productId: 'cap', author: 'Lan', rating: 4, text: 'Good colour, a little small.', createdAt: '2026-11-05T10:40:00.000Z' });
  });

  it('C2 (R4) a product with no reviews answers 200 with an empty list', async () => {
    const body = await list('jacket');
    assert.deepEqual(body.reviews, []);
    assert.equal(body.total, 0);
  });

  it('C3 (R4) the review created last comes first', async () => {
    const a = await create('cap', review({ author: 'Ann' }));
    const b = await create('cap', review({ author: 'Binh' }));
    const body = await list('cap');
    assert.deepEqual(body.reviews.map((r) => r.id), [b.id, a.id, 'r2', 'r1']);
    assert.equal(body.total, 4);
  });

  it('C4 (R4) limit and page cut the list; a page past the end is empty', async () => {
    const ids = [];
    for (const author of ['A1', 'A2', 'A3', 'A4', 'A5']) ids.unshift((await create('tshirt', review({ author }))).id);
    const p1 = await list('tshirt', '?limit=2');
    assert.deepEqual([p1.page, p1.limit, p1.total], [1, 2, 5]);
    assert.deepEqual(p1.reviews.map((r) => r.id), ids.slice(0, 2));
    const p2 = await list('tshirt', '?limit=2&page=2');
    assert.deepEqual([p2.page, p2.limit, p2.total], [2, 2, 5]);
    assert.deepEqual(p2.reviews.map((r) => r.id), ids.slice(2, 4));
    const p3 = await list('tshirt', '?page=3&limit=2');
    assert.deepEqual(p3.reviews.map((r) => r.id), ids.slice(4));
    const p4 = await list('tshirt', '?limit=2&page=4');
    assert.deepEqual(p4.reviews, []);
    assert.equal(p4.total, 5);
  });

  it('C5 (R4) 10 reviews by default, never more than 50', async () => {
    for (let i = 1; i <= 55; i++) await create('socks', review({ author: `Buyer ${i}` }));
    const def = await list('socks');
    assert.equal(def.reviews.length, 10, 'no limit → 10 reviews');
    assert.equal(def.total, 55);
    const fifty = await list('socks', '?limit=50');
    assert.equal(fifty.reviews.length, 50, 'limit=50 → 50 reviews');
    // limit=60 is decision D1: a 400, or an answer of at most 50 reviews
    const res = await get('/api/products/socks/reviews?limit=60');
    if (res.status === 400) isError(res, 400, 'VALIDATION', 'limit=60');
    else {
      assert.equal(res.status, 200, `limit=60: status ${res.status}`);
      assert.ok(res.json.reviews.length <= 50, `limit=60 answered ${res.json.reviews.length} reviews`);
    }
  });
});

describe('adding a review', () => {
  it('C6 (R5, R6) a valid review answers 201 with the review, and it is listed first', async () => {
    const before = Date.now();
    const res = await post('/api/products/hoodie/reviews', { author: '  Thu  ', rating: 5, text: 'Warm and soft.' });
    assert.equal(res.status, 201, `status ${res.status} — ${res.text.slice(0, 160)}`);
    isJson(res, 'POST');
    const r = res.json;
    isReview(r, 'the answer');
    assert.equal(r.productId, 'hoodie');
    assert.equal(r.author, 'Thu', 'author is stored without the spaces around it');
    assert.equal(r.rating, 5);
    assert.equal(r.text, 'Warm and soft.');
    const t = Date.parse(r.createdAt);
    assert.ok(t >= before - 5000 && t <= Date.now() + 5000, `createdAt ${r.createdAt} is not the time of the request`);
    const body = await list('hoodie');
    assert.deepEqual(body.reviews, [r]);
  });

  it('C7 (R6) id, productId, createdAt and other fields sent in the body are ignored', async () => {
    const r = await create('hoodie', review({ id: 'r1', productId: 'cap', createdAt: '2000-01-01T00:00:00.000Z', average: 1, verified: true }));
    isReview(r, 'the answer');
    assert.notEqual(r.id, 'r1', 'the server sets the id');
    assert.equal(r.productId, 'hoodie', 'productId comes from the path');
    assert.notEqual(r.createdAt, '2000-01-01T00:00:00.000Z', 'the server sets createdAt');
    assert.equal((await list('cap')).total, 2, 'nothing was added to cap');
    const listed = (await list('hoodie')).reviews[0];
    assert.deepEqual(listed, r, 'the stored review has no extra field');
  });

  it('C8 (R5) the string "5" is not a rating — 400 VALIDATION, nothing created', async () => {
    const res = await post('/api/products/cap/reviews', review({ rating: '5' }));
    const e = isError(res, 400, 'VALIDATION', 'rating "5"');
    assert.deepEqual(Object.keys(e.fields), ['rating'], `only rating is invalid; fields has ${Object.keys(e.fields)}`);
    assert.equal((await list('cap')).total, 2, 'nothing was created');
  });

  it('C9 (R5) 0, 6, 4.5, null and a missing rating are refused', async () => {
    for (const rating of [0, 6, 4.5, null, -1]) {
      const res = await post('/api/products/cap/reviews', review({ rating }));
      const e = isError(res, 400, 'VALIDATION', `rating ${JSON.stringify(rating)}`);
      assert.deepEqual(Object.keys(e.fields), ['rating'], `rating ${rating}: fields has ${Object.keys(e.fields)}`);
    }
    const { rating, ...noRating } = review();
    const e = isError(await post('/api/products/cap/reviews', noRating), 400, 'VALIDATION', 'no rating');
    assert.ok('rating' in e.fields);
    for (const ok of [1, 5]) await create('scarf', review({ author: `Rated ${ok}`, rating: ok }));
    assert.equal((await list('cap')).total, 2, 'nothing was created on cap');
  });

  it('C10 (R5) author: missing, only spaces, 61 characters, or not a string are refused; 60 is fine', async () => {
    const { author, ...noAuthor } = review();
    for (const [label, body] of [['missing', noAuthor], ['spaces', review({ author: '    ' })], ['61 chars', review({ author: 'x'.repeat(61) })], ['number', review({ author: 42 })], ['61 after trim', review({ author: ` ${'y'.repeat(61)} ` })]]) {
      const e = isError(await post('/api/products/cap/reviews', body), 400, 'VALIDATION', `author ${label}`);
      assert.deepEqual(Object.keys(e.fields), ['author'], `author ${label}: fields has ${Object.keys(e.fields)}`);
    }
    const r = await create('cap', review({ author: ` ${'z'.repeat(60)} ` }));
    assert.equal(r.author, 'z'.repeat(60));
  });

  it('C11 (R5) text: 501 characters or not a string are refused; 500 is fine', async () => {
    for (const [label, text] of [['501 chars', 'a'.repeat(501)], ['number', 7]]) {
      const e = isError(await post('/api/products/cap/reviews', review({ text })), 400, 'VALIDATION', `text ${label}`);
      assert.deepEqual(Object.keys(e.fields), ['text'], `text ${label}: fields has ${Object.keys(e.fields)}`);
    }
    const r = await create('cap', review({ text: 'b'.repeat(500) }));
    assert.equal(r.text.length, 500);
  });

  it('C12 (R5) every invalid field gets its own message, not only the first', async () => {
    const res = await post('/api/products/tote/reviews', { author: '', rating: '5', text: 'c'.repeat(501) });
    const e = isError(res, 400, 'VALIDATION', 'three invalid fields');
    assert.deepEqual(Object.keys(e.fields).sort(), ['author', 'rating', 'text']);
    const two = isError(await post('/api/products/tote/reviews', { author: 'Mai', rating: 9, text: 9 }), 400, 'VALIDATION', 'two invalid fields');
    assert.deepEqual(Object.keys(two.fields).sort(), ['rating', 'text'], 'author "Mai" is valid: no message for it');
    assert.equal((await list('tote')).total, 1, 'nothing was created');
  });

  it('C13 (R7) a second review by the same author answers 409 CONFLICT', async () => {
    await create('jacket', review({ author: 'Quan' }));
    isError(await post('/api/products/jacket/reviews', review({ author: 'Quan', rating: 2 })), 409, 'CONFLICT', 'Quan twice');
    isError(await post('/api/products/jacket/reviews', review({ author: '  Quan ' })), 409, 'CONFLICT', '"  Quan " after "Quan"');
    isError(await post('/api/products/cap/reviews', review({ author: 'Lan' })), 409, 'CONFLICT', 'Lan on cap (seed r2)');
    assert.equal((await list('jacket')).total, 1, 'nothing was created');
  });

  it('C14 (R7) the same author may review another product', async () => {
    const r = await create('tote', review({ author: 'Lan' }));
    assert.equal(r.author, 'Lan');
    await create('scarf', review({ author: 'Lan' }));
  });
});

describe('rating', () => {
  it('C15 (R8) count and average of the seed reviews', async () => {
    const res = await get('/api/products/cap/rating');
    assert.equal(res.status, 200, `status ${res.status} — ${res.text.slice(0, 120)}`);
    isJson(res, 'rating');
    assert.deepEqual(res.json, { productId: 'cap', count: 2, average: 4.5 });
  });

  it('C16 (R8) the average follows new reviews, rounded to 2 decimals', async () => {
    await create('tote', review({ author: 'P', rating: 5 }));
    await create('tote', review({ author: 'Q', rating: 5 }));
    const res = await get('/api/products/tote/rating');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { productId: 'tote', count: 3, average: 4.33 }, '3, 5, 5 → 4.33');
    await create('tote', review({ author: 'R', rating: 4 }));
    assert.deepEqual((await get('/api/products/tote/rating')).json, { productId: 'tote', count: 4, average: 4.25 });
  });

  it('C17 (R8) a product with no reviews has count 0 (average: decision D4)', async () => {
    const res = await get('/api/products/somi/rating');
    assert.equal(res.status, 200);
    isJson(res, 'rating');
    assert.equal(res.json.productId, 'somi');
    assert.equal(res.json.count, 0);
    assert.ok('average' in res.json, 'the answer has an average field');
  });
});

describe('removing a review', () => {
  it('C18 (R9) DELETE answers 204 with no body; the review leaves the list and the rating', async () => {
    const res = await del('/api/reviews/r1');
    assert.equal(res.status, 204, `status ${res.status} — ${res.text.slice(0, 120)}`);
    assert.equal(res.text, '', '204 has no body');
    const body = await list('cap');
    assert.deepEqual(body.reviews.map((r) => r.id), ['r2']);
    assert.equal(body.total, 1);
    assert.deepEqual((await get('/api/products/cap/rating')).json, { productId: 'cap', count: 1, average: 4 });
  });

  it('C19 (R9) a review deleted twice, or never created, answers 404 NOT_FOUND', async () => {
    assert.equal((await del('/api/reviews/r3')).status, 204);
    isError(await del('/api/reviews/r3'), 404, 'NOT_FOUND', 'r3 deleted twice');
    isError(await del('/api/reviews/no-such-review'), 404, 'NOT_FOUND', 'unknown review id');
  });

  it('C20 (R7, R9) after a delete the author may review that product again', async () => {
    assert.equal((await del('/api/reviews/r2')).status, 204);
    const r = await create('cap', review({ author: 'Lan', rating: 3 }));
    assert.equal(r.author, 'Lan');
  });

  it('C21 (R9) review ids are unique and never reused after a delete', async () => {
    const a = await create('cap', review({ author: 'One' }));
    const b = await create('tote', review({ author: 'Two' }));
    assert.equal((await del(`/api/reviews/${a.id}`)).status, 204);
    const c = await create('cap', review({ author: 'Three' }));
    const ids = ['r1', 'r2', 'r3', a.id, b.id, c.id];
    assert.equal(new Set(ids).size, ids.length, `ids repeat: ${ids.join(', ')}`);
  });
});

describe('errors', () => {
  it('C22 (R10) an unknown product answers 404 NOT_FOUND on the three product endpoints', async () => {
    isError(await get('/api/products/kimono/reviews'), 404, 'NOT_FOUND', 'GET reviews of kimono');
    isError(await post('/api/products/kimono/reviews', review()), 404, 'NOT_FOUND', 'POST a valid review to kimono');
    isError(await get('/api/products/kimono/rating'), 404, 'NOT_FOUND', 'GET rating of kimono');
  });

  it('C23 (R11) a body that is not JSON answers 400 INVALID_JSON, as JSON', async () => {
    isError(await post('/api/products/cap/reviews', '{"author": "An", "rating": 5,', { raw: true }), 400, 'INVALID_JSON', 'malformed JSON');
    assert.equal((await list('cap')).total, 2, 'nothing was created');
  });

  it('C24 (R12) an unknown path under /api answers 404 NOT_FOUND, as JSON', async () => {
    isError(await get('/api/nope'), 404, 'NOT_FOUND', 'GET /api/nope');
    isError(await get('/api/products/cap/reviews/extra'), 404, 'NOT_FOUND', 'GET /api/products/cap/reviews/extra');
  });
});
