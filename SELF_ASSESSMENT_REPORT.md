# Self-assessment - IA#5

Submitted by: **24127523 - Trần Vinh Quang**.

Total I claim: **98 / 100**.

| Criterion | Max | I claim | Evidence |
|---|---:|---:|---|
| 1. The specification - `docs/api/` | 25 | 25 | `docs/api/README.md` lists all five endpoints, the common error shape/codes, and explicit D1-D5 with example references. `docs/api/reviews.md` defines the exact six-field model, request/answer tables, validation and mutation rules R1-R12, and examples. Both files were complete in commit `3fdab82`, before implementation. |
| 2. Executable examples - contract-check | 15 | 15 | `docs/evidence/contract-check.txt` and `docs/evidence/contract-strict.txt`: 38/38 examples, 0 FAIL lines, all five endpoints covered, exit 0. Each run used a separately fresh server. Examples include POST 400/404/409, list errors, rating/delete 404, malformed JSON, D1-D5, and sequential mutation/rating effects. |
| 3. The given checks | 25 | 25 | `docs/evidence/starter-checks.txt`: all C1-C24 pass, 24 pass / 0 fail. The student's final rerun screenshots are `Ảnh minh chứng/Screenshot 2026-11-17 193211.png` (details) and `Ảnh minh chứng/Screenshot 2026-11-17 193219.png` (summary); the folder's README distinguishes baseline and final evidence. Protected-file comparison with untouched starter `32c4110` is empty for `checks/`, `tools/`, `src/data.js`, `src/server.js`, `package.json`, and `package-lock.json`; see `docs/verification.md`. Additional decision tests pass 11/11. |
| 4. Specification first, code second | 15 | 15 | History: `32c4110 starter` -> `3fdab82 spec` -> `fb8a66a` / `f8cd9d4` (recorded request and plan) -> `5c18d5f` (first implementation change). The full specification predates code, the request predates dispatch, and the approved spec was never changed after implementation began. Hidden `.git` is included in the submission. |
| 5. `PROMPT.md` | 10 | 10 | Request 1 records the exact English dispatch sent to the implementation assistant. It makes `docs/api/` authoritative, lists protected files and the dependency restriction, requires clarification rather than guessing, and defines completion through starter tests and both contract modes. Its final text was committed in `f8cd9d4` before implementation. |
| 6. `AI-LOG.md` | 10 | 8 | The log records requirement analysis, user-selected D1-D5 and external ChatGPT drafting, contract review, the implementation request/result, and independent verification. `Kept`, `Changed`, `Rejected`, and `By hand` distinguish actual contributions and name commands/evidence. Two points are not claimed because early entries were reconstructed from conversation records and the external drafting transcript was unavailable. |
| **Total** | **100** | **98** | The ZIP name is `24127523_98.zip`; its claimed total matches this table. |

## What I did not manage

The initial requirement-analysis and repository-setup log entries were written retrospectively from the actual conversation and tool records. The earlier external ChatGPT drafting prompt was not supplied to Codex, so I cannot provide a verbatim transcript of that interaction. The log states this limitation rather than inventing one.

There is no deliberate HTTP example for forcing `500 INTERNAL`, because the approved specification exposes no fault-injection endpoint. Its common error envelope is implemented and reviewed. The required behavior is covered by the supplied checks, the contract examples, and the supplemental tests; this is not a claim of production hardening, deployment, or a Classroom submission.

The real-HTTP creation-order tests do not deliberately force identical timestamps. Independent review found the tie-handling implementation correct and treated a deterministic tie-specific regression as an optional improvement.

## What I would do differently

Create the AI log at the beginning and append each request immediately. Keep the original external drafting prompt together with the selected decisions, and review every generated line before submission. I remain responsible for understanding and explaining all submitted code, including AI-assisted parts.
