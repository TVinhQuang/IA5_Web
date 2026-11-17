import express from 'express';
import { PRODUCTS, SEED_REVIEWS } from './data.js';

export const app = express();

const reviews = SEED_REVIEWS.map((review) => ({ ...review }));
let nextReviewId = BigInt(SEED_REVIEWS.length + 1);

function sendError(res, status, code, message, fields) {
  const error = { code, message };
  if (fields !== undefined) error.fields = fields;
  return res.status(status).json({ error });
}

function requireProduct(req, res, next) {
  if (!PRODUCTS.some((product) => product.id === req.params.id)) {
    return sendError(res, 404, 'NOT_FOUND', 'Product not found.');
  }
  next();
}

function validDecimal(value, maximum) {
  return typeof value === 'string' && /^\d+$/.test(value)
    && Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= maximum;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Well-formed scalar JSON reaches product lookup and field validation too.
app.use(express.json({ strict: false, limit: Infinity }));

app.get('/api/products/:id/reviews', requireProduct, (req, res) => {
  const { limit: rawLimit, page: rawPage } = req.query;
  const fields = {};
  if (rawLimit !== undefined && !validDecimal(rawLimit, 50)) {
    fields.limit = 'Must be a whole number from 1 to 50.';
  }
  if (rawPage !== undefined && !validDecimal(rawPage, Number.MAX_SAFE_INTEGER)) {
    fields.page = 'Must be a positive whole number.';
  }
  if (Object.keys(fields).length) {
    return sendError(res, 400, 'VALIDATION', 'The request has invalid fields.', fields);
  }

  const limit = rawLimit === undefined ? 10 : Number(rawLimit);
  const page = rawPage === undefined ? 1 : Number(rawPage);
  // Reverse insertion order breaks ties in favour of the later creation.
  const ordered = reviews.filter((review) => review.productId === req.params.id)
    .reverse().sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const offset = (page - 1) * limit;
  res.json({ reviews: ordered.slice(offset, offset + limit), page, limit, total: ordered.length });
});

app.post('/api/products/:id/reviews', requireProduct, (req, res) => {
  const body = req.body ?? {};
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const text = body.text === undefined ? '' : body.text;
  const fields = {};
  if (author.length < 1 || author.length > 60) {
    fields.author = 'Must be a string of 1 to 60 characters after trimming.';
  }
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    fields.rating = 'Must be a whole number from 1 to 5.';
  }
  if (typeof text !== 'string' || text.length > 500) {
    fields.text = 'Must be a string of at most 500 characters.';
  }
  if (Object.keys(fields).length) {
    return sendError(res, 400, 'VALIDATION', 'The request has invalid fields.', fields);
  }
  if (reviews.some((review) => review.productId === req.params.id
    && review.author.toLowerCase() === author.toLowerCase())) {
    return sendError(res, 409, 'CONFLICT', 'This author has already reviewed this product.');
  }

  const review = {
    id: `r${nextReviewId++}`,
    productId: req.params.id,
    author,
    rating: body.rating,
    text,
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  res.status(201).json(review);
});

app.get('/api/products/:id/rating', requireProduct, (req, res) => {
  const live = reviews.filter((review) => review.productId === req.params.id);
  const count = live.length;
  const sum = live.reduce((total, review) => total + review.rating, 0);
  const average = count === 0 ? null : Math.round(sum / count * 100) / 100;
  res.json({ productId: req.params.id, count, average });
});

app.delete('/api/reviews/:id', (req, res) => {
  const index = reviews.findIndex((review) => review.id === req.params.id);
  if (index === -1) return sendError(res, 404, 'NOT_FOUND', 'Review not found.');
  reviews.splice(index, 1);
  res.status(204).end();
});

app.use('/api', (req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'API route not found.');
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Malformed JSON request body.');
  }
  sendError(res, 500, 'INTERNAL', 'Internal server error.');
});

export default app;
