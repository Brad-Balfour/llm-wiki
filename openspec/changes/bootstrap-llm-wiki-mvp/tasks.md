## 1. Schema Foundation

- [ ] 1.1 Create `schema/interest-profile.md` v1.4 from Claude v1.3 plus the agreed v1.4 fixes and Codex depth heuristics.
- [ ] 1.2 Create `schema/classifier-instructions.md` with the two-axis output schema, thresholds, fail-closed validation rules, and validation methodology.
- [ ] 1.3 Create `schema/routing-rules.md` with commute, wiki, stream-log, review, and discard derivations.
- [ ] 1.4 Initialize `schema/compile-state.json` and `schema/model-config.example.yaml`.
- [ ] 1.5 Add fixture directories for TLDR source text and expected parser, classifier, routing, queue, feedback, and wiki outputs.

## 2. Project Runtime Setup

- [ ] 2.1 Add the TypeScript/Node project files needed for scripts, source modules, tests, linting, and formatting.
- [ ] 2.2 Record the Node runtime decision, defaulting to Node 24 unless the Phase 0 check promotes Node 26.
- [ ] 2.3 Add CI-oriented npm scripts for install, test, build or compile, lint, and format.
- [ ] 2.4 Add tests that verify parser output shape, classifier schema validation, rejected downstream behavior fields, and routing derivation.

## 3. TLDR Ingestion

- [ ] 3.1 Implement a text-file TLDR ingestion command for pasted or exported TLDR email bodies.
- [ ] 3.2 Implement parser behavior for newsletter name, edition date, editorial item title, summary, and URL.
- [ ] 3.3 Exclude primary sponsors, secondary sponsors, quick-link sponsors, TLDR hiring ads, referrals, subscription management, unsubscribe text, and forwarding wrapper text.
- [ ] 3.4 Accept confirmed email body text from a manual Gmail connector workflow without building unattended Gmail polling.
- [ ] 3.5 Require body-marker confirmation for TLDR editions and avoid subject-only identification.
- [ ] 3.6 Route ambiguous parse results and validation failures to review.
- [ ] 3.7 Run at least one real TLDR email through the local end-to-end ingestion path.

## 4. Classifier And Routing

- [ ] 4.1 Implement provider-neutral LLM adapter interfaces with model ids and provider choice supplied by config.
- [ ] 4.2 Implement one classification record per item with structured-output validation.
- [ ] 4.3 Reject or quarantine outputs that include `voice_behavior`, route, wiki destination, or other downstream behavior.
- [ ] 4.4 Derive route decisions in application code from `interest_level` and `consumption_depth`.
- [ ] 4.5 Persist classification metadata, profile version, prompt version, provider, model, and derived route for auditability.
- [ ] 4.6 Route `maybe` items and validation-failed items to review when the safer destination is unclear.

## 5. Commute Queue

- [ ] 5.1 Generate a daily commute queue ordered by `interested/headline_only`, `interested/in_depth`, `maybe/headline_only`, then `maybe/in_depth`.
- [ ] 5.2 Separate discuss items from quick-read awareness items in the queue file.
- [ ] 5.3 Include source item ids, title, summary, URL, classification scores, derived commute behavior, reason, and version metadata.
- [ ] 5.4 Keep manual ChatGPT/Claude voice review as the MVP voice path.
- [ ] 5.5 Queue explicit voice notes or commute corrections for review before wiki compile or external sending.
- [ ] 5.6 Use at least one prepared queue in a real car session or equivalent manual voice test.

## 6. Feedback Labels

- [ ] 6.1 Create JSONL feedback label storage with source item id, correction type, corrected interest, corrected depth, corrected route, reason, timestamp, profile version, prompt version, provider, and model.
- [ ] 6.2 Add a command or documented file workflow for recording manual feedback.
- [ ] 6.3 Load recent correction labels into the next day's classifier context as examples or lightweight routing overrides where appropriate.
- [ ] 6.4 Keep canonical profile updates on a cadence from repeated or high-harm patterns, not from every one-off correction.
- [ ] 6.5 Add fixture tests for feedback parsing and feedback-derived routing behavior.

## 7. Wiki Compilation

- [ ] 7.1 Compile approved full-source candidates into OKF-style markdown under `wiki/`.
- [ ] 7.2 Require frontmatter with type, title, aliases or tags where applicable, created date, updated date, confidence, and provenance.
- [ ] 7.3 Preserve prior sources when updating an existing wiki entry.
- [ ] 7.4 Track processed source hashes and output state in the compile-state manifest.
- [ ] 7.5 Add fixture tests for create, update, provenance, and idempotent compile behavior.

## 8. Read Path And Deferred Work

- [ ] 8.1 Configure GitHub Pages as the MVP read path for approved `wiki/` output.
- [ ] 8.2 Add a manually triggered GitHub Actions workflow for tests and wiki compilation after application code exists.
- [ ] 8.3 Enable scheduled nightly compile only after manual workflow runs are stable.
- [ ] 8.4 Keep secrets in GitHub Actions configuration only, never in committed files.
- [ ] 8.5 Keep RSS, YouTube, Cloudflare Workers, review UI, unattended Gmail automation, custom Realtime voice, and daily dual-provider ensembles deferred unless a later OpenSpec change promotes them.
