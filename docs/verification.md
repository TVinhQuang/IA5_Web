# IA#5 verification record

Student: Trần Vinh Quang - 24127523.

## Contract review

The user's supplied contract was copied byte-for-byte into `docs/api/README.md` and `docs/api/reviews.md`. Independent review checked it against R1-R12, D1-D5, the starter checks, and the actual contract-check parser. It found 38 valid request/response pairs, no orphan blocks, all five endpoints covered, and consistent sequential state.

The approved D2 permits omitted `text`, defaults it to `""`, allows explicitly empty text, and preserves spaces. This is the student's selected contract, including where it differs from an earlier suggestion in the discussion.

## Baseline

Before implementation, `npm.cmd test` produced **0 pass / 24 fail** on the starter, with absent reviews routes and Express HTML error responses. The starter is commit `32c4110`; the complete contract is commit `3fdab82`.

## Final verification

Verified on 2026-11-17 using Node.js v24.19.0, against implementation commit `5c18d5f`:

| Check | Observed result | Full output |
|---|---|---|
| `npm.cmd test` | Exit 0; 24 pass, 0 fail; all five suites passed. | [Starter checks](evidence/starter-checks.txt) |
| `node --test --test-reporter=spec test/decisions.test.js` | Exit 0; 11 pass, 0 fail. | [Decision checks](evidence/decision-checks.txt) |
| `node tools/contract-check.mjs --base <fresh-server>` | Exit 0; 38/38 examples; 0 FAIL lines; 5/5 endpoints covered. | [Contract examples](evidence/contract-check.txt) |
| Same command with `--strict-values` | Exit 0; 38/38 examples; 0 FAIL lines; 5/5 endpoints covered. | [Strict values](evidence/contract-strict.txt) |

Each contract run used its own newly started server with only the three seed reviews. Both owned server processes were stopped in `finally` blocks. The supplemental tests also start fresh processes and cover D1-D5, startup reset, invalid body types, and malformed JSON precedence.

Before production changes, the implementation assistant ran the 11 supplemental tests and observed 0 pass / 11 fail from absent API behavior. It then implemented the API and observed all tests and contract examples pass. The coordinator independently ran the four final checks recorded above.

## Independent implementation review

A fresh reviewer approved both specification compliance and code quality for `f8cd9d4..5c18d5f`, with no Critical or Important findings. The reviewer checked the five Review Focus areas against the approved contract and implementation diff.

One optional test-coverage improvement was deferred: the HTTP creation-order test does not force two identical timestamps. The implementation explicitly resolves equal timestamps using reverse insertion order before a stable timestamp sort; the current real-HTTP tests cover creation order without replacing the server clock. The supplied contract does not require a clock-injection interface.

The unchanged `src/server.js` still uses `Number(process.env.PORT) || 3001`; the test/helper runs on isolated ports confirm that the environment override works. The `500 INTERNAL` envelope was inspected rather than induced through a new public endpoint.

A second fresh reviewer completed the whole-branch review through `0b25c2a`, confirmed the recorded history and protected-file comparisons, and approved merging with no Critical or Important findings. The only Minor finding remained the disclosed timestamp-tie test improvement. Archive contents and remote synchronization are checked separately during handoff. The score is a self-assessment against the supplied rubric, not a guarantee of the instructor's mark. Missing external drafting records remain an explicitly disclosed evidence limitation. No deployment or production-hardening claim is made.

## Session scratch cleanup

Seven known disposable review/coordination files under `.superpowers/sdd/` were created during this session. OneDrive subsequently applied reparse attributes to their parent chain. The standing cleanup rule rejects deletion through reparse parents, so those files are retained and excluded from the submission archive. No shared temporary directory, pre-existing file, screenshot, dependency installation, source file, or requested deliverable was deleted.

## Reproduce locally

Use Node.js 18.18 or newer. Run all commands from the project root. On Windows PowerShell, use `npm.cmd` if local execution policy prevents launching `npm.ps1`; no policy change is necessary.

```text
npm install
npm test
node --test --test-reporter=spec test/decisions.test.js
```

For each contract run, start a new API process in terminal 1:

```text
npm start
```

Confirm `GET http://localhost:3001/api/health` returns `{"ok":true}`. In terminal 2:

```text
node tools/contract-check.mjs
```

Stop and restart terminal 1 before the strict-values run:

```text
node tools/contract-check.mjs --strict-values
```

If port 3001 is occupied, choose a different port using `PORT` and pass the matching `--base` URL to contract-check. The automated verification in this session uses the unchanged `checks/server.js` helper to launch a fresh process on a free port for each run, then stops only that owned process.

The tool's INFO about missing demo accounts is expected: this assignment has no authentication. `GET /api/nope` is intentionally a `text` example and is verified by starter C24.

## History and protected files

- `32c4110 starter`: original starter only.
- `3fdab82 spec`: the complete approved contract, with no implementation changes.
- `fb8a66a` and `f8cd9d4`: English implementation request, plan, and honest provenance recorded before dispatch.
- `5c18d5f`: API implementation and supplemental HTTP tests; only `src/app.js` and `test/decisions.test.js` changed.
- Final evidence and report commits follow the verified implementation without rewriting its history.

Protected-file verification command:

```text
git diff 32c4110 -- checks tools src/data.js src/server.js package.json package-lock.json
git diff 3fdab82 -- docs/api
git log --reverse --name-only
```

The first two commands printed nothing after implementation. Review the history to see the complete spec and recorded prompt before the first implementation change to `src/`. Both contract files still match the supplied documents, and their `## Changes` sections remain empty because the approved contract was not changed.

## Screenshots

The two files in `Ảnh minh chứng/` were supplied by the student before this implementation. They are retained as original baseline evidence, not represented as screenshots of the completed API.

## Submission contents

The final ZIP must contain the whole project and its hidden `.git` directory, including `docs/api/`, `PROMPT.md`, `AI-LOG.md`, and `SELF_ASSESSMENT_REPORT.md`. It excludes `node_modules/`, session scratch work, and the ZIP itself. Its student ID and claimed total must match the self-assessment.

The project was fast-forwarded onto `main` and pushed to `https://github.com/TVinhQuang/IA5_Web.git`. The submission is `../24127523_98.zip`, with a single `ia5-starter/` project folder. The archive is produced with .NET ZIP support, preserving Unicode filenames and hidden Git metadata. The Windows tar attempt failed on this OneDrive/Unicode workspace and its incomplete output was replaced by the complete ZIP.

Archive inspection opened the ZIP successfully, confirmed all required documents and `.git/HEAD`, `.git/config`, and `.git/refs/heads/main`, excluded `node_modules/`, `.superpowers/`, and Git lock files, checked the archived self-assessment total of 98, and compared every archived file to its source SHA-256 hash. The archive is refreshed and checked again after the final documentation commit so it contains the submitted history.

## Limitations

- The original external ChatGPT drafting transcript was not supplied. The log describes the known provenance without inventing the unavailable prompt.
- Initial requirement-analysis and repository-setup log entries were reconstructed from this conversation's records rather than written contemporaneously.
- The student must understand and be able to explain the submitted code and personally submit the ZIP through their university account. No Classroom submission or deployment is claimed here.
