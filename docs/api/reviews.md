# Reviews API — Endpoint details and executable examples

This document implements the five endpoints defined in [README.md](README.md). It defines their complete request and response contract from `brief-ia5.md` (R1–R12) and the explicit decisions D1–D5. **All runnable examples execute sequentially on one freshly started server.** Example IDs beginning with `r` in seed data are fixed; new review IDs and timestamps are dynamic and shown using `"…"`.

## 1. Shared data model (R1, R3)

The only valid product IDs are `tshirt`, `hoodie`, `somi`, `cap`, `tote`, `socks`, `jacket`, and `scarf`. Reviews are process-memory data and reset to three seed records whenever the server restarts: `r1` (Minh, cap, 5, 2026-11-02T03:15:00.000Z), `r2` (Lan, cap, 4, 2026-11-05T10:40:00.000Z), and `r3` (Huy, tote, 3, 2026-11-08T07:05:00.000Z).

A review object has **exactly** these six fields; there are no extra response fields.

| Field | JSON type | Set by | Required in stored review | Meaning and rules |
|---|---|---|---|---|
| `id` | string | Server | Yes | New unique review identifier; never reused within a server run, even after deletion. |
| `productId` | string | Server, from URL | Yes | One of the eight IDs from `src/data.js`. |
| `author` | string | Client, then normalized by server | Yes | Trimmed before storage; 1–60 characters after trim; uniqueness uses D3. |
| `rating` | number (integer) | Client | Yes | JSON number, whole number 1–5; JSON string `"5"` is invalid. |
| `text` | string | Client or server default | Yes | Maximum 500 characters; empty permitted; absent means `""`; spaces retained (D2). |
| `createdAt` | string | Server | Yes | Creation time in ISO 8601 UTC, e.g. `2026-11-17T08:00:00.000Z`. |

All successful responses are JSON except `204 No Content`. All errors follow `README.md` R2: `{ "error": { "code": string, "message": string } }`, with an additional `fields` object **only** for `VALIDATION` errors. Every invalid field has its own message and no invalid POST creates a review. Unknown-product lookup takes precedence over well-formed-but-invalid POST bodies (D5); malformed JSON gives `INVALID_JSON` first.

## 2. `GET /api/health`

Checks whether the application process is responding. It is already implemented in the starter.

### Request fields

| Name | Location | Type | Required | Limits | Default |
|---|---|---|---|---|---|
| — | — | — | No | No parameters or body. | — |

### Answers

| HTTP status | Error code | When |
|---:|---|---|
| 200 | — | Server is healthy; the entire JSON body is `{"ok":true}`. |
| 500 | `INTERNAL` | Unexpected server-side failure before a normal response can be produced. |

**H1 — Health success**

```http
GET /api/health
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true}
```

## 3. `GET /api/products/:id/reviews` (R1, R3, R4, R10; D1)

Returns a paginated list of reviews for exactly one product. Newest-created reviews are first; if two new reviews have an identical timestamp, the review created later in the current process comes first. Pagination is performed **after** filtering by product and ordering newest first.

### Request fields

| Name | Location | Type | Required | Limits | Default |
|---|---|---|---|---|---|
| `id` | Path | string | Yes | Existing product ID in `src/data.js`. | — |
| `limit` | Query | decimal integer string | No | Single integer from 1 to 50; invalid, empty, repeated, or out-of-range values give `400 VALIDATION` (D1). | 10 |
| `page` | Query | decimal integer string | No | Single positive safe integer; invalid, empty, repeated, or out-of-range values give `400 VALIDATION` (D1). | 1 |

### Successful answer (HTTP 200)

| Field | JSON type | Meaning |
|---|---|---|
| `reviews` | array of review objects | The current page, ordered newest first; `[]` if empty or beyond the end. |
| `page` | number (integer) | Effective page number, 1-based. |
| `limit` | number (integer) | Effective per-page limit (never above 50). |
| `total` | number (integer) | Number of **all** live reviews for the product, regardless of the requested page. |

### Answers

| HTTP status | Error code | When |
|---:|---|---|
| 200 | — | Existing product and valid query; may contain zero reviews. |
| 400 | `VALIDATION` | `limit` or `page` violates D1. `fields` names every invalid query parameter. |
| 404 | `NOT_FOUND` | Product ID does not exist. |
| 500 | `INTERNAL` | Unexpected server-side failure. |

**L1 — Seed reviews are newest first (R1, R3, R4)**

```http
GET /api/products/cap/reviews
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[{"id":"r2","productId":"cap","author":"Lan","rating":4,"text":"Good colour, a little small.","createdAt":"2026-11-05T10:40:00.000Z"},{"id":"r1","productId":"cap","author":"Minh","rating":5,"text":"Fits well, the strap is easy to adjust.","createdAt":"2026-11-02T03:15:00.000Z"}],"page":1,"limit":10,"total":2}
```

**L2 — Pagination preserves the product total (R4)**

```http
GET /api/products/cap/reviews?limit=1&page=2
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[{"id":"r1","productId":"cap","author":"Minh","rating":5,"text":"Fits well, the strap is easy to adjust.","createdAt":"2026-11-02T03:15:00.000Z"}],"page":2,"limit":1,"total":2}
```

**L3 — A page beyond the end is empty (R4)**

```http
GET /api/products/cap/reviews?limit=1&page=4
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[],"page":4,"limit":1,"total":2}
```

**L4 — A product with no reviews returns an empty list (R4)**

```http
GET /api/products/jacket/reviews
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[],"page":1,"limit":10,"total":0}
```

**L5 — Zero is not a valid limit (D1)**

```http
GET /api/products/cap/reviews?limit=0
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"limit":"Must be a whole number from 1 to 50."}}}
```

**L6 — A limit of 100 exceeds the maximum (D1)**

```http
GET /api/products/cap/reviews?limit=100
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"limit":"Must be a whole number from 1 to 50."}}}
```

**L7 — Two invalid query fields are both reported (D1, R2)**

```http
GET /api/products/cap/reviews?limit=abc&page=2.5
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"limit":"Must be a whole number from 1 to 50.","page":"Must be a positive whole number."}}}
```

**L8 — A negative page is invalid (D1)**

```http
GET /api/products/cap/reviews?page=-1
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"page":"Must be a positive whole number."}}}
```

**L9 — Page 100 is valid but past the end (D1)**

```http
GET /api/products/cap/reviews?page=100
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[],"page":100,"limit":10,"total":2}
```

**L10 — Unknown product (R10)**

```http
GET /api/products/kimono/reviews
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Product not found."}}
```

## 4. `GET /api/products/:id/rating` (R8, R10; D4)

Calculates the rating summary **from the currently live reviews**, not from cached totals. The numeric average is the arithmetic mean rounded to two decimal places (for example, `(3+5+5)/3 = 4.33`). When there are no reviews, the average is `null` under D4.

### Request fields

| Name | Location | Type | Required | Limits | Default |
|---|---|---|---|---|---|
| `id` | Path | string | Yes | Existing product ID. | — |

### Successful answer (HTTP 200)

| Field | JSON type | Meaning |
|---|---|---|
| `productId` | string | Product identifier from the URL. |
| `count` | number (integer) | Number of current reviews. |
| `average` | number or null | Average rating rounded to two decimal places; `null` if `count === 0`. |

### Answers

| HTTP status | Error code | When |
|---:|---|---|
| 200 | — | Product exists, including with no reviews. |
| 404 | `NOT_FOUND` | Product ID does not exist. |
| 500 | `INTERNAL` | Unexpected server-side failure. |

**A1 — Seed average on cap (R8)**

```http
GET /api/products/cap/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"cap","count":2,"average":4.5}
```

**A2 — No reviews means a null average (D4)**

```http
GET /api/products/somi/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"somi","count":0,"average":null}
```

**A3 — Unknown product (R10)**

```http
GET /api/products/kimono/rating
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Product not found."}}
```

**A4 — Seed average on tote before any changes (R8)**

```http
GET /api/products/tote/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"tote","count":1,"average":3}
```

## 5. `POST /api/products/:id/reviews` (R2, R3, R5–R7, R10, R11; D2, D3, D5)

Adds exactly one live review. Validation collects **all** invalid body fields before replying; a failed request creates nothing. The server chooses `id`, uses the URL as `productId`, and records a new UTC `createdAt`. Unknown body fields, including attempts to supply server-owned fields, are ignored (R6).

### Request fields

| Name | Location | JSON type | Required | Limits / behavior | Default |
|---|---|---|---|---|---|
| `id` | Path | string | Yes | Existing product ID. | — |
| `author` | Body | string | Yes | Trim leading/trailing whitespace; after trimming 1–60 characters. | — |
| `rating` | Body | number (integer) | Yes | Must be 1, 2, 3, 4, or 5 as a JSON number; strings like `"5"`, fractions, `null`, and missing values are invalid. | — |
| `text` | Body | string | No | If provided, may be empty; preserve spaces; stored length at most 500 characters. | `""` (D2) |
| `id`, `productId`, `createdAt`, or other fields | Body | any | No | Ignored; never stored or echoed from client input. | Server assigns its own values. |

A second live review for the same product and trimmed, case-insensitively equal `author` is a conflict (D3). The same author can review a different product; deleting the review permits a later new one.

### Successful answer (HTTP 201)

The entire response body is **one review object** with exactly the six fields in section 1, **not** `{ "review": ... }` or `{ "ok": true }`.

### Answers

| HTTP status | Error code | When |
|---:|---|---|
| 201 | — | A valid, non-duplicate review has been created. |
| 400 | `VALIDATION` | One or more body fields fail validation (R5); `fields` contains every invalid field. |
| 400 | `INVALID_JSON` | Request body is syntactically malformed JSON (R11). |
| 404 | `NOT_FOUND` | Product does not exist, including when a well-formed body has invalid fields (D5). |
| 409 | `CONFLICT` | This author already has a live review of this product (R7, D3). |
| 500 | `INTERNAL` | Unexpected server-side failure. |

**P1 — Trim author but preserve text spaces (R5, R6, D2)**

```http
POST /api/products/hoodie/reviews
Content-Type: application/json

{"author":"  Thu  ","rating":5,"text":" Warm and soft. "}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"hoodie","author":"Thu","rating":5,"text":" Warm and soft. ","createdAt":"…"}
```

**P2 — Omitted text is stored as an empty string (D2)**

```http
POST /api/products/hoodie/reviews
Content-Type: application/json

{"author":"Mai","rating":4}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"hoodie","author":"Mai","rating":4,"text":"","createdAt":"…"}
```

**P2b — Explicitly empty text is valid (D2)**

```http
POST /api/products/socks/reviews
Content-Type: application/json

{"author":"An","rating":5,"text":""}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"socks","author":"An","rating":5,"text":"","createdAt":"…"}
```

**P3 — `thu` conflicts with `Thu` on the same product (R7, D3)**

```http
POST /api/products/hoodie/reviews
Content-Type: application/json

{"author":"thu","rating":3,"text":"I disagree."}
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error":{"code":"CONFLICT","message":"This author has already reviewed this product."}}
```

**P4 — An existing seed author also conflicts (R7)**

```http
POST /api/products/cap/reviews
Content-Type: application/json

{"author":"  Lan  ","rating":5,"text":"Another cap review."}
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error":{"code":"CONFLICT","message":"This author has already reviewed this product."}}
```

**P5 — String `"5"` is not a rating (R5)**

```http
POST /api/products/hoodie/reviews
Content-Type: application/json

{"author":"Binh","rating":"5","text":"This must be rejected."}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"rating":"Must be a whole number from 1 to 5."}}}
```

**P6 — Return every invalid field together, without creating a review (R5)**

```http
POST /api/products/hoodie/reviews
Content-Type: application/json

{"author":"  ","rating":9,"text":123}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"VALIDATION","message":"The request has invalid fields.","fields":{"author":"Must be a string of 1 to 60 characters after trimming.","rating":"Must be a whole number from 1 to 5.","text":"Must be a string of at most 500 characters."}}}
```

**P7 — Ignore client-owned extras, including fake server fields (R6)**

```http
POST /api/products/cap/reviews
Content-Type: application/json

{"author":"Hoa","rating":4,"text":"Nice cap.","id":"r1","productId":"tote","createdAt":"2000-01-01T00:00:00.000Z","average":1,"verified":true}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"cap","author":"Hoa","rating":4,"text":"Nice cap.","createdAt":"…"}
```

**P8 — A second author can review tote (R7)**

```http
POST /api/products/tote/reviews
Content-Type: application/json

{"author":"P","rating":5,"text":"Very good."}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"tote","author":"P","rating":5,"text":"Very good.","createdAt":"…"}
```

**P9 — Another author can review the same product (R7)**

```http
POST /api/products/tote/reviews
Content-Type: application/json

{"author":"Q","rating":5,"text":"Excellent."}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"tote","author":"Q","rating":5,"text":"Excellent.","createdAt":"…"}
```

**P10 — Unknown product wins over field validation on valid JSON (R10, D5)**

```http
POST /api/products/kimono/reviews
Content-Type: application/json

{"author":"","rating":9,"text":123}
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Product not found."}}
```

**P11 — Unknown product with an otherwise valid review (R10)**

```http
POST /api/products/kimono/reviews
Content-Type: application/json

{"author":"Nga","rating":5,"text":"Not available."}
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Product not found."}}
```

**P12 — A syntactically malformed JSON body is not an HTML error (R11)**

```http
POST /api/products/cap/reviews
Content-Type: application/json

{"author":"Nga","rating":5,
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"INVALID_JSON","message":"Malformed JSON request body."}}
```

**P13 — Malformed JSON takes precedence even for an unknown product (R11, D5)**

```http
POST /api/products/kimono/reviews
Content-Type: application/json

{"author":"An","rating":5,
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":{"code":"INVALID_JSON","message":"Malformed JSON request body."}}
```

## 6. `GET /api/products/:id/rating` after creating reviews (R8)

The following example deliberately occurs **after P8 and P9**. Tote has now three live reviews with ratings 3, 5, and 5.

**A5 — Count and average update after POST operations (R8)**

```http
GET /api/products/tote/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"tote","count":3,"average":4.33}
```

## 7. `DELETE /api/reviews/:id` (R7, R9)

Deleting a review removes it from both the product's review list and rating calculations. The previously used review ID is never assigned to a new review within the same server process. The deleted author's name becomes eligible for a new review on that product.

### Request fields

| Name | Location | Type | Required | Limits | Default |
|---|---|---|---|---|---|
| `id` | Path | string | Yes | A currently existing review ID. | — |

### Answers

| HTTP status | Error code | When |
|---:|---|---|
| 204 | — | Review deleted; response has **no body**. |
| 404 | `NOT_FOUND` | Review ID is unknown or was already deleted. |
| 500 | `INTERNAL` | Unexpected server-side failure. |

**X1 — Delete seeded review `r1` (R9)**

```http
DELETE /api/reviews/r1
```

```http
HTTP/1.1 204 No Content
```

**X2 — The cap average changes after deleting r1 (R8, R9)**

```http
GET /api/products/cap/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"cap","count":2,"average":4}
```

**X3 — Deleting an already deleted ID returns 404 (R9)**

```http
DELETE /api/reviews/r1
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Review not found."}}
```

**X4 — Deleting an unknown ID returns 404 (R9)**

```http
DELETE /api/reviews/no-such-review
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"Review not found."}}
```

**X5 — Deleting the other seeded cap review (R9)**

```http
DELETE /api/reviews/r2
```

```http
HTTP/1.1 204 No Content
```

**X6 — Lan may review cap again after deletion (R7, R9)**

```http
POST /api/products/cap/reviews
Content-Type: application/json

{"author":"Lan","rating":3,"text":"A new review after deletion."}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":"…","productId":"cap","author":"Lan","rating":3,"text":"A new review after deletion.","createdAt":"…"}
```

**X7 — The cap rating reflects only the remaining reviews (R8, R9)**

```http
GET /api/products/cap/rating
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"productId":"cap","count":2,"average":3.5}
```

**X8 — The cap list includes only the two current reviews (R4, R9)**

```http
GET /api/products/cap/reviews
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"reviews":[{"id":"…","productId":"cap","author":"Lan","rating":3,"text":"A new review after deletion.","createdAt":"…"},{"id":"…","productId":"cap","author":"Hoa","rating":4,"text":"Nice cap.","createdAt":"…"}],"page":1,"limit":10,"total":2}
```

## 8. Unknown paths under `/api` (R12)

An unmatched path under `/api` returns HTTP 404 with `Content-Type: application/json` and `{"error":{"code":"NOT_FOUND","message":"API route not found."}}`. This is a **cross-cutting error rule**, not a sixth public endpoint. For example (illustrative only; do not execute as an `http` contract example):

```text
GET /api/nope

HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":{"code":"NOT_FOUND","message":"API route not found."}}
```

Starter check **C24** executes this rule, including a route such as `/api/products/cap/reviews/extra`. The contract-check tool intentionally skips this `text` block because `/api/nope` is not in the five-row endpoint table.

## 9. Verification and non-example edge cases

- All invalid POST field values are rejected: missing/blank/non-string/over-60-character `author`, `rating` missing or not an integer JSON number from 1 to 5, and non-string or over-500-character `text`. All such cases return `400 VALIDATION`, with every invalid field listed, and do not mutate reviews.
- Limits are enforced after trimming `author`, but `text` is never trimmed. A 60-character trimmed author and 500-character text are accepted; 61 and 501 are rejected.
- An author may review another product, but cannot create a second live review of the same product even by changing name capitalization (D3). Once the prior review is deleted, the author may create a new one.
- `GET /api/products/:id/rating` is calculated from live data, and `average` is rounded to two decimal places; deleting or adding a review immediately changes it.
- Internal `500 INTERNAL` is the common error convention for an unexpected server failure; it has no executable example because this starter does not provide an endpoint for reliably inducing a server fault.
- `npm test` runs starter checks C1–C24; `node tools/contract-check.mjs` validates the ordered examples above against a freshly started server; `--strict-values` also checks literal example values.

## Changes

<!-- Leave this section empty until a specification change is made after the first src/ implementation commit. Each later change must include the date, the rule changed, and the reason. -->
