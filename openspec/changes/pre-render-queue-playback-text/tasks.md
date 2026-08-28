# Tasks

## 1. Contract and validation

- [x] 1.1 Add the queue-v3 JSON Schema with `description` and required `playback_text`.
- [x] 1.2 Add deterministic playback rendering and reject mismatches in TypeScript validation.
- [x] 1.3 Preserve explicit local queue-v2 and session-snapshot compatibility.

## 2. Project surfaces

- [x] 2.1 Update Voice instructions so default playback reads only `playback_text`.
- [x] 2.2 Update generation instructions, managed Task prompt, examples, and source-bundle deployment notes for v3.
- [x] 2.3 Document the coupled rollout and v2 migration rule.

## 3. Verification

- [x] 3.1 Cover headline-only, in-depth, punctuation, quotation marks, absent byline/source, and drift rejection.
- [ ] 3.2 Run a real long-session trial and record zero generated additions or omitted literal text before promotion.
