# Reviews API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Complete IA#5 from the user's approved contract and produce a verifiable submission archive.

**Architecture:** Keep the Express application in `src/app.js` and the existing process entry point in `src/server.js`. Copy seed reviews into process-local mutable state; implement the four missing routes and shared JSON error handling. Test HTTP behavior with the unchanged starter checks, the contract's examples, and supplemental decision tests.

**Tech Stack:** Node.js >=18.18, Express 5, Node built-in modules and test runner.

**Spec:** `docs/api/README.md` and `docs/api/reviews.md`, copied without changes from the user's two supplied files and committed as `3fdab82` before implementation.

## Global Constraints

- Express 5 and Node's built-in modules only: no new dependency in `package.json`.
- `npm start` serves the API on port 3001; `src/server.js` keeps reading `PORT` from the environment.
- Do not edit `checks/`, `tools/`, `src/data.js`, `docs/api/`, or the `test` script of `package.json`.
- Reviews live in memory and every server start begins with exactly `SEED_REVIEWS`.
- The approved contract wins over this plan or any implementation assumption.
- All authored documentation is in English; retain the student's proper name accurately.
- Preserve the user's two pre-existing screenshots and installed `node_modules/`.

## Review Focus

- Empty, repeated, fractional, exponential, and unsafe-integer query values must produce D1 validation errors rather than silent coercion.
- Missing, empty, and whitespace-containing text must follow D2; invalid provided text must not mutate state.
- Trimmed, case-insensitive author identity must work against seeds and be released after deletion.
- Well-formed scalar, array, and null JSON must not be mistaken for syntactically malformed JSON; unknown-product precedence follows D5.
- Empty averages, fresh-process seed restoration, and creation ordering must remain correct after mutations.

---

### Task 1: Implement and verify the contract

**Files:**
- Modify: `src/app.js`.
- Create: `test/decisions.test.js`.
- Test without modifying: `checks/reviews.test.js`, `checks/server.js`, `tools/contract-check.mjs`.

**Interfaces:**
- Consumes: `PRODUCTS` and `SEED_REVIEWS` from `src/data.js`; approved request and response shapes and exact messages from `docs/api/`.
- Produces: the existing named/default `app` export implementing exactly the five public endpoints, with shared JSON errors.

- [x] Read both spec files and the existing checks before changing production code.
- [x] Add HTTP regression tests for the five Review Focus items in `test/decisions.test.js`; use the existing `startServer()` helper, which starts an isolated process per test. Test real responses and state, without mocking application internals.
- [x] Run `node --test --test-reporter=spec test/decisions.test.js` on the starter and confirm failure due to absent behavior. Baseline `npm.cmd test` was already observed as 0 pass / 24 fail before implementation.
- [x] Implement process-local review state, the four missing routes, exact validation messages, server-owned fields, author uniqueness, pagination, live ratings, deletion, unknown API routes, and JSON error middleware in `src/app.js`.
- [x] Run `npm.cmd test` (expected: 24 pass, 0 fail).
- [x] Run `node --test --test-reporter=spec test/decisions.test.js` (expected: all supplemental tests pass).
- [x] Verify contract-check normally and with `--strict-values`, each on its own freshly started server (expected: 38/38 examples, 0 FAIL lines, all five endpoints covered).
- [x] Verify protected files and the approved contract have no changes from their baseline commits; self-review and report results before committing only the allowed implementation/test files.

### Task 2: Review, document, and package

**Files:**
- Create/update: `PROMPT.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`, and `docs/verification.md`.
- Preserve: all source material, screenshots, and the committed Git history.
- Output: `../24127523_<claimed-total>.zip`.

**Interfaces:**
- Consumes: Task 1's committed API and actual command results; student identity supplied by the user.
- Produces: evidence-backed English documentation and a ZIP with the complete project, hidden `.git`, and no `node_modules/` or session scratch files.

- [x] Keep the exact English implementation dispatch in `PROMPT.md`, committed before sending it to the implementation assistant.
- [x] Log prior provenance honestly: the user chose D1-D5 and supplied a ChatGPT-drafted contract; the external prompt/transcript is unavailable. Earlier Codex review/setup entries are reconstructed from this conversation, not represented as contemporaneous entries.
- [x] Obtain an independent review of the committed implementation against the approved contract, including the Review Focus inputs; resolve material findings with a failing regression test before the fix.
- [x] Record actual verification commands, outcomes, protected-file checks, and commit chronology in `docs/verification.md`.
- [x] Write the six-row self-assessment with specific evidence and a candid `What I did not manage` section. Do not claim deployment, Classroom submission, or unavailable external chat records.
- [ ] Integrate the completed branch, push to the user-authorized GitHub repository, and confirm local/remote commit hashes agree.
- [ ] Package the project including `.git`, verify ZIP contents and document totals, and remove only proven disposable session artifacts.
