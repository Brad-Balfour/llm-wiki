## Current Implementation Priority (reconciled 2026-07-26)

The working product path is now ChatGPT Project + Gmail + downloadable v2 queue
artifacts + one-queue Voice sessions + downloadable session bundles. At home,
Brad supplies the original queue(s) and bundle(s) to a maintenance chat; the
agent invokes the repository's package scripts to validate, import, debug, and
maintain the wiki. That user workflow is the non-regression baseline.

The provider-neutral classifier and a local deterministic queue generator were
part of the original unattended-runtime plan. They remain possible resilience
work, not an automatic replacement for the working Project path. Do not build
sections 4 or 5 merely because their original boxes remain open. First decide,
from the scheduled-task diagnosis and real workflow evidence, whether the local
runtime is needed as a fallback, a validation control, or the future default.

## 1. Schema Foundation

- [x] 1.1 Create `schema/interest-profile.md` v1.4 from Claude v1.3 plus the agreed v1.4 fixes and Codex depth heuristics.
- [x] 1.2 Create `schema/classifier-instructions.md` with the two-axis output schema, thresholds, fail-closed validation rules, and validation methodology.
- [x] 1.3 Create `schema/routing-rules.md` with commute, wiki, stream-log, review, and discard derivations.
- [x] 1.4 Initialize `schema/compile-state.json` and `schema/model-config.example.yaml`.
- [x] 1.5 Add fixture directories for TLDR source text and expected parser, classifier, routing, queue, feedback, and wiki outputs.

## 2. Project Runtime Setup

- [x] 2.1 Add the TypeScript/Node project files needed for scripts, source modules, tests, linting, and formatting.
- [x] 2.2 Record the Node runtime decision, defaulting to Node 24 unless the Phase 0 check promotes Node 26.
- [x] 2.3 Add CI-oriented npm scripts for install, test, build or compile, lint, and format.
- [x] 2.4 Add focused tests, preferably before or alongside production code, that verify parser output shape, classifier schema validation, rejected downstream behavior fields, and routing derivation.

## 3. TLDR Ingestion

- [x] 3.1 Implement a text-file TLDR ingestion command for pasted or exported TLDR email bodies.
- [x] 3.2 Implement parser behavior for newsletter name, edition date, editorial item title, summary, and URL.
- [x] 3.3 Exclude primary sponsors, secondary sponsors, quick-link sponsors, TLDR hiring ads, referrals, subscription management, unsubscribe text, and forwarding wrapper text.
- [x] 3.4 Accept confirmed email body text from a manual Gmail connector workflow without building unattended Gmail polling.
- [x] 3.5 Require body-marker confirmation for TLDR editions and avoid subject-only identification.
- [x] 3.6 Route ambiguous parse results and validation failures to review.
- [x] 3.7 Run at least one real TLDR email through the local end-to-end ingestion path.

## 4. Classifier And Routing

**Scope:** classifier calibration and an optional local model-execution
runtime. This section does not describe Voice playback defects, bundle
generation failures, queue discovery, or other product-quality incidents.

- [ ] 4.1 Decide whether a local provider-neutral classifier is still needed
      after comparing the working Project classifier with the scheduled-task
      failure evidence. If accepted, implement adapter interfaces with model
      ids, provider choice, and classifier batch size supplied by config.
- [ ] 4.2 If task 4.1 is accepted, implement batch-capable model execution with
      one score-first classification record per item and structured-output
      validation. Existing batch validation alone does not satisfy this task.
- [x] 4.3 Reject or quarantine outputs that include `voice_behavior`, route, wiki destination, or other downstream behavior.
- [x] 4.4 Derive route decisions in application code from `interest_level` and `consumption_depth`.
- [ ] 4.5 If the local classifier is retained, persist its scores, derived
      labels, profile version, prompt version, provider, model, and derived
      route for auditability and threshold tuning. Session-bundle incidents are
      not classification persistence.
- [x] 4.6 Route `maybe` items and validation-failed items to review when the safer destination is unclear.

## 5. Commute Queue

**Scope:** v2 queue production. The live/manual Project generator is the
current working producer. Tasks 5.1-5.3 describe a possible deterministic local
producer and are gated by the same fallback/default decision as task 4.1; they
must not displace the working manual path without comparative evidence.

- [ ] 5.1 If a local producer is accepted, generate a daily v2 commute queue
      with one canonical `items` array ordered by `interested/headline_only`,
      `interested/in_depth`, `maybe/headline_only`, then `maybe/in_depth`.
- [ ] 5.2 If a local producer is accepted, preserve quick-read versus discuss
      behavior as per-item metadata in that one ordered array; do not recreate
      the retired split-array/two-cursor format.
- [x] 5.2a Define manual-Project duplicate resolution by interest score, depth
      score, then source order, producing one winning item in the canonical v2
      array rather than competing queue sections.
- [ ] 5.3 If a local producer is accepted, include source item ids, title,
      summary, URL, classification scores, derived commute behavior, reason,
      playback position, and version metadata required by queue v2.
- [x] 5.4 Keep manual ChatGPT/Claude voice review as the MVP voice path.
- [x] 5.5 Keep exact classifier corrections, playback/product incidents,
      presentation preferences, duplicate/prior-awareness observations, wiki
      captures, and assistant synthesis in separate bundle/import outputs.
      Only an exact `wiki this` capture enters wiki maintenance; classifier
      corrections do not silently become public content.
- [x] 5.6 Use at least one prepared queue in a real car session or equivalent manual voice test.
- [x] 5.7 Define private-by-default v1/v2 legacy handoff contracts and a
      backward-compatible importer. This remains compatibility code; new
      sessions use the operating-loop session-bundle contract.
- [x] 5.7a Historical completion only: define and test the former append-only
      ChatGPT ledger/reconstruction design. Real commute evidence superseded it
      for new sessions; do not revive it as current work.
- [x] 5.8 Historical acceptance evidence: use a legacy handoff in a real
      commute and import its `.txt` artifact without manual JSON repair. Current
      acceptance evidence is the real session-bundle flow in the successor
      change.

## 6. Classifier Correction Labels

**Scope:** this is the classifier-learning loop only. It records Brad's
item-bound interest/depth/routing corrections. Car/Voice defects, failed
artifact writes, queue-recovery failures, presentation preferences, duplicate
observations, and assistant-generated synthesis belong to quality-incident or
other dedicated records, not classifier labels.

- [x] 6.1 Create JSONL feedback label storage with source item id, correction type, original scores/labels, corrected interest, corrected depth, corrected route, reason, timestamp, profile version, prompt version, provider, and model.
- [x] 6.2 Add a command or documented file workflow for recording manual feedback.
- [ ] 6.3 Load recent correction labels into the next day's classifier context as examples or lightweight routing overrides where appropriate.
- [x] 6.4 Keep canonical profile updates on a cadence from repeated or high-harm patterns, not from every one-off correction.
- [x] 6.5a Add fixture tests for feedback parsing, exact item identity, private
      append-only persistence, duplicates, and non-classifier exclusions.
- [ ] 6.5b Add feedback-derived routing behavior tests when task 6.3 introduces
      an explicit label-consumption policy; recording labels alone must not
      affect live routing.

## 7. Wiki Compilation

- [x] 7.0 Create the review-safe `wiki/` index, taxonomy directories, and OKF entry template without claiming compiler completion.
- [x] 7.1 Compile approved full-source candidates into OKF-style markdown under `wiki/`.
- [x] 7.2 Require frontmatter with type, title, aliases or tags where applicable, created date, updated date, confidence, and provenance.
- [x] 7.3 Preserve prior sources when updating an existing wiki entry.
- [x] 7.4 Track processed source hashes and output state in the compile-state manifest.
- [x] 7.5 Add fixture tests for create, update, provenance, and idempotent compile behavior.
- [x] 7.6 Require explicit local public confirmation, structured safety review, safe HTTP(S) URLs, unsafe-content rejection, and escaped Markdown rendering.
- [x] 7.7 Reject stable source-item-id collisions when immutable source path or URL differs.
- [x] 7.8 Convert validated `wiki_review` handoff notes into private, non-approved draft candidates that enumerate missing enrichment and approval fields.
- [x] 7.9 Orchestrate reviewed enrichment, immutable source creation, and compilation behind a second explicit public-confirmation flag, with contained enrichment lookup and rollback on failure.
- [x] 7.10 Process every wiki-marked handoff item in one run with per-item results, while leaving duplicates unchanged and clearly reporting items that still need source details or a reviewed summary.

## 8. Read Path And Deferred Work

- [x] 8.0 Add the local repository-backed Pages entry point and minimal Jekyll configuration; keep public enablement pending review.
- [x] 8.0a Make the wiki landing and taxonomy indexes Jekyll-renderable at stable directory URLs and verify their frontmatter in tests.
- [x] 8.0b Parse Jekyll configuration and Pages-visible Markdown frontmatter in the deterministic project checks, including compiler-compatible template provenance.
- [x] 8.0c Exclude the entry template from public Pages output and taxonomy listings.
- [x] 8.1 Configure GitHub Pages as the MVP read path for approved `wiki/` output.
- [x] 8.2 Add a manually triggered GitHub Actions workflow for tests and wiki compilation after application code exists.
- [ ] 8.3 Enable scheduled nightly compile only after manual workflow runs are stable.
- [ ] 8.4 Keep secrets in GitHub Actions configuration only, never in committed files.
- [ ] 8.5 Keep RSS, YouTube, Cloudflare Workers, review UI, unattended Gmail automation, custom Realtime voice, and daily dual-provider ensembles deferred unless a later OpenSpec change promotes them.

## 9. Implementation Quality Gate

- [ ] 9.1 For each code-bearing implementation PR, write or update focused tests before or alongside production code when the behavior is deterministic and reasonably testable.
- [ ] 9.2 Run the relevant local checks before PR creation or PR update, including tests, lint, format, build or compile, OpenSpec validation, and schema/fixture validation where applicable.
- [ ] 9.3 Run an independent pre-PR review against the diff and OpenSpec requirements using either a separate Codex subagent or a local Claude review before requesting GitHub Codex review.
- [ ] 9.4 Address material independent-review findings or document why they are intentionally deferred before opening the PR or requesting GitHub Codex review.
- [ ] 9.5 Request GitHub Codex/Copilot review only after local checks and independent pre-PR review are complete.
