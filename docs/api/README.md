# IA#5 — Reviews API contract

**Version:** 1.0 (specification before implementation)  
**Base URL:** `http://localhost:3001`  
**Source:** `brief-ia5.md` (R1–R12); this contract resolves D1–D5.

This contract describes an in-memory reviews API for the eight products defined in `src/data.js`. The server restarts with exactly `SEED_REVIEWS`: `r1` and `r2` for `cap`, and `r3` for `tote`. No database or file persistence is used. All five endpoints below are the complete public API specified for IA#5. The health endpoint already exists in the starter.

## Endpoints

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/health` | Return server health as `{"ok":true}`. |
| `GET` | `/api/products/:id/reviews` | List a product's reviews, newest first, with pagination. |
| `POST` | `/api/products/:id/reviews` | Create one review for the product. |
| `GET` | `/api/products/:id/rating` | Return the product's review count and average rating. |
| `DELETE` | `/api/reviews/:id` | Delete a review by its review ID. |

The `:id` parameter identifies a **product** for the three `/api/products/...` endpoints, but identifies a **review** for `DELETE /api/reviews/:id`. Valid product IDs are `tshirt`, `hoodie`, `somi`, `cap`, `tote`, `socks`, `jacket`, and `scarf`.

## Representation and common rules

- All responses are JSON with `Content-Type: application/json`, except a successful `204 No Content` response, which has no body.
- Every review has **exactly six fields**: `id`, `productId`, `author`, `rating`, `text`, and `createdAt`. Their types, ownership, and validation rules are specified in [reviews.md](reviews.md).
- The server alone assigns `id`, `productId` (from the URL), and `createdAt` (the current ISO 8601 UTC timestamp). Client-supplied values for server-owned fields and any unknown body fields are ignored.
- Reviews are stored in process memory and reset to the three seed reviews on each server start. Within one run, IDs are unique and never reused, even if a review is deleted.
- An author can review multiple products, but can have only one live review per product, according to D3. Removing that review releases the restriction.
- Malformed JSON is rejected with `400 INVALID_JSON` before the product/body validation stages. For well-formed JSON, unknown-product lookup precedes field validation (D5); field validation precedes duplicate-author checks.
- An unknown path under `/api` returns `404 NOT_FOUND` as JSON. The contract intentionally lists no sixth endpoint for that catch-all behavior.

## Standard error response (R2)

Every error response has a single top-level `error` object:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "The request has invalid fields.",
    "fields": {
      "rating": "Must be a whole number from 1 to 5."
    }
  }
}
```

`error.code` is a machine-readable string. `error.message` is a nonempty, human-readable sentence. **Only `VALIDATION` includes `error.fields`**, which is an object containing exactly one nonempty message for each invalid field and no messages for valid fields. No error has additional top-level fields.

| Error code | HTTP status | When it is used | Standard `message` |
|---|---:|---|---|
| `VALIDATION` | 400 | Invalid query parameter or review body field. | `The request has invalid fields.` |
| `INVALID_JSON` | 400 | A JSON request body is syntactically malformed. | `Malformed JSON request body.` |
| `NOT_FOUND` | 404 | Unknown product, review, or `/api` route. | `Product not found.`, `Review not found.`, or `API route not found.` |
| `CONFLICT` | 409 | An author already has a live review of the same product. | `This author has already reviewed this product.` |
| `INTERNAL` | 500 | An unexpected server-side failure. | `Internal server error.` |

For predictable validation failures, these field-level messages are used:

| Field | Message |
|---|---|
| `limit` | `Must be a whole number from 1 to 50.` |
| `page` | `Must be a positive whole number.` |
| `author` | `Must be a string of 1 to 60 characters after trimming.` |
| `rating` | `Must be a whole number from 1 to 5.` |
| `text` | `Must be a string of at most 500 characters.` |

The exact response bodies and error cases are demonstrated in [reviews.md](reviews.md).

## Decisions D1–D5

**D1 — Invalid `limit` or `page`:** When supplied, `limit` must be a single decimal whole number from **1 through 50**, and `page` must be a single positive safe integer; `0`, `-1`, `abc`, `2.5`, an empty value, repeated values, and `limit=100` produce `400 VALIDATION`, while `page=100` is valid and returns an empty page when it exceeds the data (examples **L5–L9** in `reviews.md`).

**D2 — Optional `text` and spaces:** `text` is optional, defaults to the empty string `""`, permits an explicitly empty string, and preserves leading and trailing spaces; its maximum of 500 characters is checked on the stored, untrimmed string (examples **P1, P2, and P2b** in `reviews.md`).

**D3 — Author identity:** Author uniqueness within a product is checked by comparing the **trimmed author names case-insensitively**, so `"Thu"` and `"thu"` are the same author, while the displayed `author` retains the capitalization of the original trimmed value (example **P3** in `reviews.md`).

**D4 — Empty average:** A product with zero reviews has `count: 0` and `average: null`, not zero (example **A2** in `reviews.md`).

**D5 — Unknown product before validation:** A `POST` with a syntactically valid JSON body to an unknown product returns `404 NOT_FOUND` even if that body has invalid review fields; a syntactically malformed JSON body is instead `400 INVALID_JSON` under R11 (examples **P10, P12, and P13** in `reviews.md`).

## HTTP examples, ordering, and testability

Runnable request/response pairs are in [reviews.md](reviews.md). The contract-check tool executes those pairs top to bottom against **one freshly started server**. Dynamic `id` and `createdAt` values are written as `"…"` in example responses, which the checker treats as wildcards. Other values (including pagination totals and average ratings) are specified exactly.

The catch-all behavior for `GET /api/nope` is documented in a **`text` code block** in `reviews.md`, rather than as a runnable `http` example: the checker rejects any runnable example whose method and path are not one of the five endpoint-table rows. Starter check **C24** executes the unknown-route case separately.

## Changes

<!-- Leave this section empty until a specification change is made after the first src/ implementation commit. Each later change must include the date, the rule changed, and the reason. -->
