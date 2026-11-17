# AI assistance log - IA#5

Student: Tran Vinh Quang (24127523).

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
Result: Specification committed before implementation; implementation request committed before dispatch. Implementation results and final review will be appended after they occur.
