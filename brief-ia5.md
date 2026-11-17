# Brief — IA#5: a reviews API for the shop

*The requirements of the reviews API, in prose. You turn them into a spec —
`docs/api/README.md` and `docs/api/reviews.md` — and commit it **before** any
route is written. Your assistant may help you draft the spec; you read it,
decide D1–D5, and commit it. Then you give your assistant the spec as the
thing to follow: where the code and the spec disagree, the spec is right
unless you change it on purpose. `README.md` explains the order of work and
how you check what comes back.*

---

The shop of sessions 6 and 7 sells eight products (`src/data.js`). Customers
can now leave a review on a product: a name, a rating from 1 to 5 and a
short text. The API stores reviews, lists them, removes them and gives each
product's rating.

## Endpoints

Five endpoints, no more. The starter already has the first.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/health` | `{"ok": true}` — already in the starter |
| `GET` | `/api/products/:id/reviews` | the reviews of one product, newest first, a page at a time |
| `POST` | `/api/products/:id/reviews` | adds a review to one product |
| `GET` | `/api/products/:id/rating` | how many reviews a product has, and their average |
| `DELETE` | `/api/reviews/:id` | removes one review |

`:id` in the first three is a product id from `src/data.js` (`tshirt`,
`hoodie`, `somi`, `cap`, `tote`, `socks`, `jacket`, `scarf`); in the last,
it is a review id.

## Requirements

**R1 — Data.** The products are the eight of `src/data.js`. Reviews live in
memory and every start of the server begins from the three reviews of
`SEED_REVIEWS` (`r1`, `r2` on `cap`; `r3` on `tote`). No database, no file.

**R2 — One error shape.** Every answer is JSON (`Content-Type:
application/json`), except the `204` of R9. Every error answer, from every
endpoint, has the same shape:

```json
{"error": {"code": "VALIDATION", "message": "The review has invalid fields.", "fields": {"rating": "Must be a whole number from 1 to 5."}}}
```

- `code` is one of `VALIDATION`, `INVALID_JSON`, `NOT_FOUND`, `CONFLICT`
  (and `INTERNAL` for a `500`) — or a code your spec adds for a case this
  brief does not cover;
- `message` is one sentence for a person;
- `fields` appears **only** with `VALIDATION`; it has one message for each
  invalid field of the request, and nothing for the valid ones.

**R3 — A review.** A review has exactly these fields: `id` (a string),
`productId`, `author`, `rating` (a number), `text`, `createdAt` (the time it
was created, as an ISO 8601 UTC string such as `2026-11-17T08:00:00.000Z`).

**R4 — Listing.** `GET /api/products/:id/reviews` answers `200` with

```json
{"reviews": [ … ], "page": 1, "limit": 10, "total": 2}
```

- `reviews` is newest first: the review created last comes first;
- `limit` reviews per page, `10` when the request has no `limit`; never more
  than `50` reviews in one answer;
- `page` starts at `1`, `1` when the request has no `page`; a page past the
  end answers `200` with an empty `reviews`;
- `total` is the number of reviews of that product, on every page.

**R5 — Adding: the rules.** `POST /api/products/:id/reviews` takes a JSON
body with three fields:

- `author` — a string; spaces at the start and the end are removed, then it
  must be 1 to 60 characters long; it is stored without those spaces;
- `rating` — a whole number from 1 to 5, sent as a JSON number. The string
  `"5"` is **not** a rating, nor are `4.5`, `0`, `6` or `null`;
- `text` — a string of at most 500 characters.

A request that breaks any rule answers `400` `VALIDATION`, with a message for
**every** field that breaks one — not only the first — and creates nothing.

**R6 — Adding: the answer.** A valid review answers `201` with the review
(R3) as the whole body. The server sets `id`, `productId` (from the path) and
`createdAt`. Any other field in the body — an `id`, a `createdAt`, an
`average`, anything — is ignored: not stored, not in the answer.

**R7 — One review per author.** A second review of the same product by the
same author answers `409` `CONFLICT` and creates nothing. The same author
may review other products.

**R8 — Rating.** `GET /api/products/:id/rating` answers `200` with

```json
{"productId": "cap", "count": 2, "average": 4.5}
```

`count` and `average` are computed by the server from the reviews it has
now; `average` is rounded to 2 decimal places (`4.33` for 3, 5, 5).

**R9 — Removing.** `DELETE /api/reviews/:id` answers `204` with no body. The
review is gone from the list and from the rating, and its author may review
that product again. A review id that does not exist — or no longer exists —
answers `404` `NOT_FOUND`. Review ids are never reused, not even after a
delete.

**R10 — Unknown product.** A product id that is not in `src/data.js`
answers `404` `NOT_FOUND` on the three product endpoints.

**R11 — Malformed JSON.** A body that is not valid JSON answers `400`
`INVALID_JSON` in the shape of R2 — not Express's HTML error page.

**R12 — Unknown path.** Any other path under `/api` (`GET /api/nope`)
answers `404` `NOT_FOUND` in the shape of R2.

## Decisions this brief leaves to you

The brief does not decide these. **Your spec must** — one sentence each, with
at least one example that shows it — and the server must do what your spec
says.

- **D1.** A `limit` or `page` that is not a whole number in range — `0`,
  `-1`, `abc`, `2.5`, `100`: a `400`, or a fallback value? Say which, for
  each case.
- **D2.** May `text` be missing, or empty? Are spaces around it removed?
- **D3.** Is `An` the same author as `an` for R7?
- **D4.** What `average` is for a product with no reviews (`null`? `0`?).
- **D5.** A `POST` to an unknown product with an invalid body: `404` or
  `400`?

## Constraints

- Express 5 and Node's built-in modules only: no new dependency in
  `package.json`.
- `npm start` serves the API on port 3001; `src/server.js` keeps reading
  `PORT` from the environment (the checks start it on their own port).
- Do not edit `checks/`, `tools/`, `src/data.js`, or the `test` script of
  `package.json`.
- Keep every check in `checks/` passing: `npm test`.
