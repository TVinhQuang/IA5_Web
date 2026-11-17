import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../checks/server.js';

let server;
beforeEach(async () => { server = await startServer(); });
afterEach(async () => { await server?.stop(); });

const messages = {
  limit: 'Must be a whole number from 1 to 50.',
  page: 'Must be a positive whole number.',
  author: 'Must be a string of 1 to 60 characters after trimming.',
  rating: 'Must be a whole number from 1 to 5.',
  text: 'Must be a string of at most 500 characters.',
};

async function request(method, path, body, raw = false) {
  const options = { method, signal: AbortSignal.timeout(5000) };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = raw ? body : JSON.stringify(body);
  }
  const response = await fetch(server.base + path, options);
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { /* Assert the response below. */ }
  return { status: response.status, type: response.headers.get('content-type'), text, json };
}

function expectJson(response, status) {
  assert.equal(response.status, status, response.text);
  assert.match(response.type ?? '', /application\/json/);
  assert.notEqual(response.json, undefined, response.text);
  return response.json;
}

function expectError(response, status, code, message, fields) {
  const error = { code, message };
  if (fields !== undefined) error.fields = fields;
  assert.deepEqual(expectJson(response, status), { error });
}

function expectValidation(response, fields) {
  expectError(response, 400, 'VALIDATION', 'The request has invalid fields.', fields);
}

async function list(productId, query = '') {
  return expectJson(await request('GET', `/api/products/${productId}/reviews${query}`), 200);
}

async function create(productId, body) {
  return expectJson(await request('POST', `/api/products/${productId}/reviews`, body), 201);
}

async function rating(productId) {
  return expectJson(await request('GET', `/api/products/${productId}/rating`), 200);
}

test('D1 rejects invalid decimal and repeated pagination without changing reviews', async () => {
  for (const field of ['limit', 'page']) {
    for (const value of ['0', '-1', 'abc', '2.5', '', '1e1', '0x10', '%20', '%2B1', '9007199254740992']) {
      const response = await request('GET', `/api/products/cap/reviews?${field}=${value}`);
      expectValidation(response, { [field]: messages[field] });
    }
    const repeated = await request('GET', `/api/products/cap/reviews?${field}=1&${field}=1`);
    expectValidation(repeated, { [field]: messages[field] });
  }
  for (const limit of [51, 100]) {
    expectValidation(await request('GET', `/api/products/cap/reviews?limit=${limit}`), { limit: messages.limit });
  }
  expectValidation(await request('GET', '/api/products/cap/reviews?limit=&page=0'), {
    limit: messages.limit,
    page: messages.page,
  });
  expectValidation(await request('GET', '/api/products/cap/reviews?limit=1&limit=2&page=1&page=2'), {
    limit: messages.limit,
    page: messages.page,
  });
  assert.deepEqual((await list('cap')).reviews.map((review) => review.id), ['r2', 'r1']);
});

test('D1 accepts boundary pagination and safe pages beyond the end', async () => {
  const first = await list('cap', '?limit=1&page=1');
  assert.deepEqual([first.page, first.limit, first.total], [1, 1, 2]);
  assert.deepEqual(first.reviews.map((review) => review.id), ['r2']);
  const second = await list('cap', '?limit=1&page=2');
  assert.deepEqual(second.reviews.map((review) => review.id), ['r1']);
  assert.equal(second.total, 2);
  const maximum = await list('cap', '?limit=50');
  assert.deepEqual([maximum.page, maximum.limit, maximum.total, maximum.reviews.length], [1, 50, 2, 2]);
  assert.deepEqual(await list('cap', '?page=100'), { reviews: [], page: 100, limit: 10, total: 2 });
  assert.deepEqual(await list('cap', '?limit=50&page=9007199254740991'), {
    reviews: [], page: 9007199254740991, limit: 50, total: 2,
  });
});

test('D2 defaults omitted text, accepts empty text, and stores whitespace verbatim', async () => {
  const omitted = await create('hoodie', { author: '  Thu  ', rating: 5 });
  const empty = await create('hoodie', { author: 'Mai', rating: 4, text: '' });
  const spaced = await create('hoodie', { author: 'An', rating: 3, text: ' Warm and soft. ' });
  assert.equal(omitted.author, 'Thu');
  assert.equal(omitted.text, '');
  assert.equal(empty.text, '');
  assert.equal(spaced.text, ' Warm and soft. ');
  const stored = await list('hoodie');
  assert.equal(stored.total, 3);
  assert.deepEqual(stored.reviews, [spaced, empty, omitted]);
});

test('D2 enforces the 500-character limit on untrimmed text and rejects non-strings', async () => {
  const accepted = await create('jacket', { author: 'Boundary', rating: 5, text: ` ${'x'.repeat(498)} ` });
  assert.equal(accepted.text, ` ${'x'.repeat(498)} `);
  for (const text of [` ${'x'.repeat(499)} `, ' '.repeat(501), null, false, 7, [], {}]) {
    expectValidation(await request('POST', '/api/products/jacket/reviews', { author: 'Rejected', rating: 5, text }), {
      text: messages.text,
    });
  }
  assert.deepEqual((await list('jacket')).reviews, [accepted]);
  assert.deepEqual(await rating('jacket'), { productId: 'jacket', count: 1, average: 5 });
});

test('D3 compares trimmed authors case-insensitively and validates before conflict checks', async () => {
  const original = await create('hoodie', { author: '  Thu  ', rating: 5 });
  assert.equal(original.author, 'Thu');
  for (const author of ['thu', ' THU ', 'tHu']) {
    expectError(await request('POST', '/api/products/hoodie/reviews', { author, rating: 4 }),
      409, 'CONFLICT', 'This author has already reviewed this product.');
  }
  expectValidation(await request('POST', '/api/products/hoodie/reviews', { author: 'thu', rating: '5', text: null }), {
    rating: messages.rating,
    text: messages.text,
  });
  expectError(await request('POST', '/api/products/cap/reviews', { author: ' lAN ', rating: 4 }),
    409, 'CONFLICT', 'This author has already reviewed this product.');
  assert.equal((await create('scarf', { author: 'thu', rating: 3 })).author, 'thu');
  assert.deepEqual((await list('hoodie')).reviews, [original]);
});

test('D3 deletion releases author identity and leaves deleted IDs unavailable', async () => {
  const first = await create('socks', { author: '  Thu ', rating: 2 });
  const deleted = await request('DELETE', `/api/reviews/${first.id}`);
  assert.equal(deleted.status, 204);
  assert.equal(deleted.text, '');
  assert.deepEqual(await list('socks'), { reviews: [], page: 1, limit: 10, total: 0 });
  assert.deepEqual(await rating('socks'), { productId: 'socks', count: 0, average: null });
  const replacement = await create('socks', { author: ' tHU ', rating: 4 });
  assert.equal(replacement.author, 'tHU');
  assert.notEqual(replacement.id, first.id);
  assert.deepEqual((await list('socks')).reviews, [replacement]);
  expectError(await request('DELETE', `/api/reviews/${first.id}`), 404, 'NOT_FOUND', 'Review not found.');
  assert.deepEqual(await rating('socks'), { productId: 'socks', count: 1, average: 4 });
});

test('D4 returns null for initially empty products and after the last deletion', async () => {
  assert.deepEqual(await rating('somi'), { productId: 'somi', count: 0, average: null });
  assert.deepEqual(await rating('cap'), { productId: 'cap', count: 2, average: 4.5 });
  assert.equal((await request('DELETE', '/api/reviews/r1')).status, 204);
  assert.equal((await request('DELETE', '/api/reviews/r2')).status, 204);
  assert.deepEqual(await rating('cap'), { productId: 'cap', count: 0, average: null });
  assert.deepEqual(await list('cap'), { reviews: [], page: 1, limit: 10, total: 0 });
});

test('a fresh process restores exactly the seed reviews after creations and deletions', async () => {
  await create('hoodie', { author: 'New', rating: 5 });
  for (const id of ['r1', 'r2', 'r3']) {
    assert.equal((await request('DELETE', `/api/reviews/${id}`)).status, 204);
  }
  await server.stop();
  server = await startServer();
  assert.deepEqual((await list('cap')).reviews, [
    { id: 'r2', productId: 'cap', author: 'Lan', rating: 4, text: 'Good colour, a little small.', createdAt: '2026-11-05T10:40:00.000Z' },
    { id: 'r1', productId: 'cap', author: 'Minh', rating: 5, text: 'Fits well, the strap is easy to adjust.', createdAt: '2026-11-02T03:15:00.000Z' },
  ]);
  assert.deepEqual((await list('tote')).reviews, [
    { id: 'r3', productId: 'tote', author: 'Huy', rating: 3, text: 'Strong canvas, but the handles are short.', createdAt: '2026-11-08T07:05:00.000Z' },
  ]);
  for (const productId of ['tshirt', 'hoodie', 'somi', 'socks', 'jacket', 'scarf']) {
    assert.deepEqual(await list(productId), { reviews: [], page: 1, limit: 10, total: 0 });
  }
});

test('D5 well-formed scalar, null, and array JSON use product lookup then field validation', async () => {
  for (const body of ['5', '"hello"', 'true', 'false', 'null', '[]', '[{"author":"An","rating":5}]']) {
    expectError(await request('POST', '/api/products/kimono/reviews', body, true),
      404, 'NOT_FOUND', 'Product not found.');
    expectValidation(await request('POST', '/api/products/cap/reviews', body, true), {
      author: messages.author,
      rating: messages.rating,
    });
  }
  assert.deepEqual((await list('cap')).reviews.map((review) => review.id), ['r2', 'r1']);
  assert.deepEqual(await rating('cap'), { productId: 'cap', count: 2, average: 4.5 });
});

test('D5 unknown product precedes all field errors in well-formed objects', async () => {
  for (const body of [{}, { author: '', rating: 9, text: 123 }, { author: 'Lan', rating: '5' }]) {
    expectError(await request('POST', '/api/products/kimono/reviews', body),
      404, 'NOT_FOUND', 'Product not found.');
  }
  expectValidation(await request('POST', '/api/products/cap/reviews', { author: '', rating: 9, text: 123 }), {
    author: messages.author,
    rating: messages.rating,
    text: messages.text,
  });
  assert.equal((await list('cap')).total, 2);
});

test('malformed JSON precedes D5 product lookup and never mutates reviews', async () => {
  for (const productId of ['cap', 'kimono']) {
    for (const body of ['{"author":"An","rating":5,', 'nul', '[1,]', '"unterminated']) {
      expectError(await request('POST', `/api/products/${productId}/reviews`, body, true),
        400, 'INVALID_JSON', 'Malformed JSON request body.');
    }
  }
  assert.deepEqual((await list('cap')).reviews.map((review) => review.id), ['r2', 'r1']);
  assert.deepEqual(await rating('cap'), { productId: 'cap', count: 2, average: 4.5 });
});
