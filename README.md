# IA#5 — A REST API from a specification

**CSC13008 · individual assignment · 2% of the course · 100 points**
**The rubric is attached to the Classroom assignment — read it before you start.**

**Spec first, code second.** You write down exactly what the reviews API
answers — every endpoint, every field, every error — and commit it **before
any route exists**. Then your assistant implements the spec, and you prove
the server does what the spec says with two tools: the checks in `checks/`
and `tools/contract-check.mjs`, which sends every example of your spec to
your running server.

What the API must do is in [`brief-ia5.md`](brief-ia5.md): requirements
R1–R12, and five decisions D1–D5 that the brief leaves to you.

## Set up

You need **Node 18.18 or newer** (`node --version`).

```bash
cd ia5-starter
npm install
git init && git add . && git commit -m "starter"
npm start          # http://localhost:3001/api/health → {"ok":true}
npm test           # the checks in checks/ — all 24 fail on the starter: that is the point
```

Port taken? `PORT=3002 npm start` (Windows PowerShell: `$env:PORT=3002; npm start`),
then add `--base http://localhost:3002` to the contract-check command below.

## The order of work

The commit history is part of the mark: it is how we see that the spec came
first.

1. **Starter commit** — the untouched starter, as above.
2. **Write the spec, commit it.** Two files in `docs/api/` (shapes below):
   `README.md` — the endpoint table, the error shape, D1–D5; and
   `reviews.md` — each endpoint, its fields, its answers, its examples. Your
   assistant may help you draft it from the brief; you read every line and
   decide D1–D5. `git commit -m "spec"` — **before any route is written**.
3. **Write `PROMPT.md`, commit it, give it to your assistant.** The request
   you send: it hands over `docs/api/` as the thing to follow (see *What to
   tell your assistant*). Commit before every request, so each of its changes
   is its own diff.
4. **Check, then tell it what failed.** `npm test`, then contract-check on a
   freshly started server. A failing line gets one precise sentence to the
   assistant; check again.
5. **Write as you go:** `AI-LOG.md` one entry per request, then
   `SELF_ASSESSMENT_REPORT.md` at the end.

**When the code and the spec disagree**, the spec is right — fix the code.
Change the spec only when the spec was wrong, and then add a line to the
`## Changes` section at the bottom of that file: the date, what changed, why.
A spec quietly rewritten to match the code is the thing this assignment is
about not doing.

## Run contract-check

```bash
# terminal 1 — a freshly started server (stop it with Ctrl+C and start it again before every run)
npm start

# terminal 2 — from the root of your folder
node tools/contract-check.mjs
```

First open `http://localhost:3001/api/health`: it must answer `{"ok":true}`.
If another program already holds port 3001 (a dev server from another
course, an old copy of this one), contract-check tests **that** program and
its answers make no sense. Stop it, or use `PORT=3002 npm start` and
`node tools/contract-check.mjs --base http://localhost:3002`.

It reads `docs/api/README.md` first, then the other `docs/api/*.md` in
alphabetical order, each from top to bottom, and sends every example to
`http://localhost:3001`, one after the other, **without restarting**: an
example that adds or deletes a review changes what the next example gets.
Write your examples in an order that works on a fresh server (the three
seed reviews `r1`, `r2`, `r3` have fixed ids — use them).

For each example it compares the **status** and the **names of the JSON
fields**, at every depth. Values that differ (an `id`, a `createdAt`) are
printed as `note` lines and do not fail — read them anyway. At the end it
lists the endpoints of your table that no example calls.

The first line it prints is

```text
INFO  FRONTEND.md  no "Demo accounts" section in FRONTEND.md or BACKEND.md: examples with {{token:…}} cannot be sent
```

That is expected: IA#5 has no sign-in, so there is no `FRONTEND.md`. Ignore
it. The last line is the result, for example `21/21 examples answered as
written; 0 FAIL line(s)`. `node tools/contract-check.mjs --help` lists the options.

## The spec — `docs/api/`

**`docs/api/README.md`** holds:

- the endpoint table — one row per endpoint, the method and the path in their
  own cells (contract-check reads this table):

  ```markdown
  | Method | Path | What it does |
  |---|---|---|
  | `GET` | `/api/products/:id/reviews` | the reviews of one product, newest first |
  ```

- the error shape, and the list of `code` values with the status of each;
- **Decisions** — D1 to D5, one sentence each, saying what your API does, and
  which example in `reviews.md` shows it.

**`docs/api/reviews.md`** holds, for each endpoint:

- the request: path parameters, query parameters, body fields — a table with
  **name, type, required, limits, default**;
- the answers: a table with **status, code, when** — every success and every
  error that endpoint can give;
- examples: a request block and the answer block under it, both fenced as
  `http`:

  ````markdown
  ```http
  POST /api/products/cap/reviews
  Content-Type: application/json

  {"author": "An", "rating": "5", "text": "Nice."}
  ```

  ```http
  HTTP/1.1 400 Bad Request
  Content-Type: application/json

  {"error": {"code": "VALIDATION", "message": "…", "fields": {"rating": "…"}}}
  ```
  ````

  `…` in an answer means *any value* (`"id": "…"`), any object (`{…}`), any
  list (`[…]`), or more items at the end of a list (`[{…}, …]`). A request
  body must be something we can send: no `…` in it.

Aim for at least one example per answer in your tables, and one for each of
D1–D5. One exception: an `http` example whose method and path are not in
your endpoint table is a FAIL, so show R12 (`GET /api/nope`) in a `text`
block — contract-check does not send `text` blocks.

At the bottom of each file, a `## Changes` section — empty until you change
the spec after the implementation started.

## What to tell your assistant

`PROMPT.md` is the request you send, word for word. It should:

- name `docs/api/` as **the spec to implement**, and say that where the spec
  and anything else disagree, the spec wins;
- say what it must not touch: `checks/`, `tools/`, `src/data.js`, `docs/api/`,
  the `test` script, and no new dependency;
- ask it to stop and ask, not guess, where the spec is unclear;
- say how it is done: `npm test` and contract-check both clean.

After that, a failing line gets one sentence that names what you ran, what
you saw, and the line of the spec:

- *"contract-check, reviews.md:58: `POST /api/products/cap/reviews` with
  rating `"5"` answers 201; the spec says 400 VALIDATION with
  `fields.rating`. Accept only a JSON number."*
- *"C18: `DELETE /api/reviews/r1` answers 200 with `{"ok": true}`; the spec
  says 204 with no body."*
- *"`git diff checks/` shows you changed C6. Revert it: the checks are the
  brief, not the code."*

## Done means

| # | Do this | You should see |
|---|---|---|
| 1 | `npm test` | `ℹ pass 24` and `ℹ fail 0` |
| 2 | Restart the server; `node tools/contract-check.mjs` | `0 FAIL line(s)`, and `PASS README.md every endpoint in the table has an example` |
| 3 | `git diff <starter commit> -- checks tools src/data.js package.json` | **nothing** — no check, tool, data or dependency changed |
| 4 | `git log --reverse --format="%h %ad %s" --name-only -- docs src` | a commit with `docs/api/` comes **before** the first commit with a file of `src/` |
| 5 | Read `docs/api/reviews.md` against `brief-ia5.md` | every endpoint has a request table, an answers table and examples; every rule of R2–R12 is in it |
| 6 | Read `docs/api/README.md` | D1–D5, each a sentence and an example contract-check runs |
| 7 | `git log -p -- docs/api` after the spec commit | every change has a line in `## Changes` |

Rows 1–4 are tools; rows 5–7 are what no tool checks — whether your spec says
enough for someone else to build the same API.

## Hand in

Zip **the whole folder including its hidden `.git` folder, without
`node_modules/`**. At the top of the folder: `docs/api/`, `PROMPT.md`,
`AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`. Everything you write in English.

Name the zip after your student ID **and the total you give yourself** in
`SELF_ASSESSMENT_REPORT.md`: `<StudentID>_<total>.zip`, for example
`24127001_86.zip`.

Templates for `AI-LOG.md` and `SELF_ASSESSMENT_REPORT.md` are in *Course
documents* on Classroom.
