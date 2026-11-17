# AI assistance log - IA#5

Student: Trần Vinh Quang (24127523).

## 2026-11-17 - Requirement analysis and untouched starter commit

Tool: Codex, with a read-only starter-audit assistant.
Asked for: Read the project and explain the work and submission requirements, then commit the untouched starter to the student's GitHub repository.
Kept: The requirements/rubric summary and starter-only commit `32c4110`.
Changed: Used `npm.cmd` for PowerShell compatibility when later running the baseline, without changing PowerShell policy or the project scripts.
Rejected: No source changes were proposed during the initial audit; the starter and protected files were inspected before committing.
By hand: The student created the GitHub repository and supplied its URL, installed the existing dependencies, and saved two screenshots.
Provenance: This entry was written later from the actual conversation and tool records; it was not a contemporaneous log entry.

## 2026-11-17 - D1-D5 discussion and external contract drafting

Tool: Codex for explanation; ChatGPT outside this Codex conversation for the student's supplied draft.
Asked for: Explain D1-D5 and make the student's selected requirements easier to read as two contract files.
Kept: The student's supplied `README.md` and `reviews.md`, copied byte-for-byte into `docs/api/` and committed as `3fdab82` before implementation.
Changed: The student selected optional `text`, defaulting to an empty string, instead of Codex's earlier suggestion that the field be required; the approved D2 was retained.
Rejected: No speculative implementation was accepted before committing the full contract.
By hand: The student chose the contract decisions, supplied the final files, and requested review before implementation.
Provenance: The external ChatGPT prompt and transcript were not supplied. Their wording is not invented here; this entry records the student's stated provenance and the inspected files.

## 2026-11-17 - Independent contract review and implementation handoff

Tool: Codex, with an independent read-only contract reviewer and an implementation assistant.
Asked for: Review the supplied contract against the assignment and, if sound, complete the assignment; the exact implementation dispatch is Request 1 in `PROMPT.md`.
Kept: Both contract files without changes; all 38 request/response pairs parsed, every endpoint was covered, and the sequential cap/tote totals and averages were consistent.
Changed: Accepted the two trailing spaces in the supplied README as intentional Markdown line breaks rather than rewriting the approved file to satisfy a generic whitespace check.
Rejected: No contract changes were needed. The initial `npm test` PowerShell launch was replaced by `npm.cmd test`; the real starter baseline was then observed as 0 pass / 24 fail because the reviews API was absent.
By hand: The student supplied their name and confirmed student ID 24127523.
Result: Specification committed before implementation; implementation request committed before dispatch. The implementation assistant wrote 11 HTTP tests first and observed 0 pass / 11 fail for missing API behavior, then implemented and committed only `src/app.js` and `test/decisions.test.js` as `5c18d5f`. It reported 24/24 starter checks, 11/11 supplemental tests, and 38/38 examples in each contract mode. No unresolved self-review concern was reported.

## 2026-11-17 - Independent verification and submission evidence

Tool: Codex coordinator.
Asked for: Complete the assignment from the approved contract and prepare the required submission documents.
Kept: The implementation from Request 1 after independently running `npm.cmd test`, the supplemental tests, and both contract modes on newly started servers; outputs are retained in `docs/evidence/`.
Changed: Added reproducible verification documentation and an evidence-based self-assessment; retained the student's existing screenshots as baseline evidence rather than presenting them as final passing-test screenshots.
Rejected: No functional implementation change was needed after these verification runs. `git diff 32c4110 -- checks tools src/data.js src/server.js package.json package-lock.json` and `git diff 3fdab82 -- docs/api` were both empty.
By hand: The student chose the approved contract and confirmed their identity; the coordinator authored the implementation handoff, verification record, log, and report with AI assistance. No student-authored implementation is claimed.
Result: 24/24 starter checks, 11/11 supplemental checks, and 38/38 contract examples in both normal and strict-values modes; all exited 0, with no failed or skipped tests.

## 2026-11-17 - Independent implementation review

Tool: Codex, with a fresh read-only task reviewer.
Asked for: Check the committed implementation against the approved contract and Task 1, judging specification compliance and code quality.
Kept: The implementation after the reviewer approved it with no Critical or Important findings.
Changed: Documented the review's optional coverage limitation: the HTTP creation-order test does not deliberately force identical timestamps. The implementation's reverse insertion order and stable sort handle ties correctly.
Rejected: No code fix was requested for this optional test improvement. Unchanged port configuration and protected-file comparisons were separately verified by the coordinator; the 500 branch was inspected without adding a fault-injection route.
By hand: No new student-authored code is claimed.
Result: Task quality Approved; specification compliant. A second fresh reviewer completed the whole-branch review through `0b25c2a`, confirmed the history/evidence/protected-file comparisons, and approved merging with no Critical or Important findings. The same optional timestamp-tie regression remains disclosed. Final ZIP contents and remote synchronization are checked separately during handoff.

Cleanup: Seven verified session scratch files under `.superpowers/sdd/` are retained because OneDrive applied reparse attributes to their parent chain and the standing cleanup rule prohibits deletion through such parents. They are excluded from the submission ZIP. No pre-existing files or requested deliverables are cleanup targets.

## 2026-11-17 - GitHub synchronization and archive inspection

Tool: Codex coordinator, Git, and .NET ZIP support.
Asked for: Finish the reviewed assignment and prepare its submission archive.
Kept: The complete commit sequence, approved contract, passing implementation, required reports, verification outputs, and the student's two baseline screenshots.
Changed: Used .NET ZIP support after the Windows tar attempt failed on the OneDrive/Unicode workspace; replaced only the incomplete submission output created by this session.
Rejected: `node_modules/`, session scratch `.superpowers/`, and transient Git lock files are excluded from the submission archive. No user file was removed.
By hand: The student remains responsible for personally submitting the archive through their university account and explaining the work.
Result: Merged by fast-forward onto `main` and pushed to the provided GitHub repository. The ZIP opened successfully, required documents and hidden Git metadata were present, its total matched 98, and every archived file matched its source SHA-256 hash. Final documentation is committed before refreshing and rechecking the delivered archive.
