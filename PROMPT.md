# Assistant requests

This file records the exact English implementation requests sent by the Codex coordinator to its implementation assistant. They operationalize the student's approved contract; they are not presented as quotations from the student's Vietnamese messages. The original external ChatGPT drafting prompt was not supplied and is not reconstructed here.

## Request 1 - Implement the approved contract

Committed before dispatch and before any implementation change to `src/`.

```text
Implement the IA#5 reviews API in the existing project at C:/Users/Admin/OneDrive - VNU-HCMUS/Documents/Phát triển ứng dụng web/Cá nhân/IA5/ia5-starter.

Read docs/api/README.md and docs/api/reviews.md first. These are the approved specification; where this request, the brief, a plan, or existing code disagrees with them, the specification wins. Read Task 1 of docs/superpowers/plans/2026-11-17-reviews-api.md for the implementation and verification steps.

Implement only src/app.js and add meaningful HTTP regression tests in test/decisions.test.js. Do not edit checks/, tools/, src/data.js, docs/api/, package.json, package-lock.json, or src/server.js, and do not add dependencies. Keep both existing app exports and the health endpoint. Use Express 5 and Node built-in modules only. Preserve the user's screenshots and existing dependencies.

Follow test-driven development: write the supplemental tests first, run them against the starter and verify that missing API behavior causes them to fail, then implement the smallest complete API following the specification. Cover invalid and repeated pagination, D2 optional/empty/untrimmed text, case-insensitive author identity and deletion, empty averages and startup seed reset, and well-formed scalar/null/array JSON versus malformed JSON and D5 precedence. Check actual JSON error bodies and state, not mocks.

Stop and ask the coordinator if the specification is unclear or contradictory; do not guess or change the specification to match the code.

Done means npm.cmd test passes all 24 starter checks, all supplemental tests pass, and both normal contract-check and --strict-values pass all 38 examples with 0 FAIL lines and all five endpoints covered, each contract run using a freshly started server. Use the existing checks/server.js startServer() helper to obtain an isolated free port when verifying contracts. Do not create background services or leave servers running. Do not modify the protected test script.

Commit only src/app.js and test/decisions.test.js after verification, using a descriptive feature commit. Other files are owned by the coordinator. Do not push, merge, or spawn subagents. Read the session-c-drive-cleanup skill; create no temporary files if possible. Return status, commit hash, exact test results, red-test evidence, self-review findings, and any cleanup candidates. The coordinator handles provenance logs, final reports, archive packaging, and independent review.
```
