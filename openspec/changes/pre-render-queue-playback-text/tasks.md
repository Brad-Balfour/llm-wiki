# Tasks

## Queue v4 extension

- [x] Add the queue-v4 playback/reference pair and deterministic validator
- [x] Update Voice to return to the main file after on-demand reference access

## 1. Contract and validation

- [x] 1.1 Add the queue-v3 JSON Schema with `description` and required `playback_text`.
- [x] 1.2 Add deterministic playback rendering and reject mismatches in TypeScript validation.
- [x] 1.3 Preserve explicit local queue-v2 and session-snapshot compatibility.
- [x] 1.4 Add required nullable author/publication metadata and deterministic top-level sweep validation.

## 2. Project surfaces

- [x] 2.1 Update Voice instructions so default playback reads only `playback_text`.
- [x] 2.2 Update generation instructions, managed Task prompt, examples, and source-bundle deployment notes for v3.
- [x] 2.3 Document the coupled rollout and v2 migration rule.
- [x] 2.4 Make Voice read `sweep_playback` directly and expose attribution only on request.

## 3. Verification

- [x] 3.1 Cover headline-only, in-depth, punctuation, quotation marks, nullable attribution, item-playback drift, and sweep drift rejection.
- [ ] 3.2 Run a real long-session trial and record zero generated additions or omitted literal text before promotion.
