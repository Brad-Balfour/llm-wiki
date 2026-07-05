## Context

The implementation repo is the public project surface. The parent
`/Users/brad/Documents/GitHub/llm-wiki` folder remains the exploration archive
and private planning source. The repo already has OpenSpec initialized for
Codex, GitHub Copilot, and Claude Code, but this change is the first real
OpenSpec proposal pass for the MVP.

The planning sources converge on a TLDR-only first milestone. Claude's v1.3
interest profile is the relevance base for production v1.4. The v1.4 profile
adds the agreed refinements from fresh validation, while Codex contributes the
depth heuristics, source-neutral classifier contract, fixture strategy, and
implementation mechanics. Routing behavior belongs in application code, not in
the classifier output.

## Goals / Non-Goals

**Goals:**

- Build a file-first TLDR pipeline in TypeScript/Node.
- Support connector-assisted Gmail/TLDR discovery and text-file fallback.
- Parse confirmed TLDR editions into non-sponsor editorial items.
- Classify each item on independent interest and depth axes.
- Treat continuous interest/depth scores as the calibration values and enum
  labels as threshold-derived routing labels.
- Validate structured model output and fail closed to review.
- Derive commute, wiki, stream-log, review, and discard behavior in code.
- Generate a prepared commute queue for manual voice review.
- Store Brad's corrections as feedback labels.
- Compile approved material into OKF-style markdown with provenance.
- Use GitHub Pages as the first read path.

**Non-Goals:**

- Unattended Gmail automation.
- RSS or YouTube ingestion.
- Cloudflare Worker ingestion.
- Review/admin UI.
- Full commute transcription.
- Custom realtime voice/tool-calling agent.
- Daily dual-provider classifier ensemble.
- Public promotion of private Range.com notes, raw Gmail bodies, sensitive voice
  notes, or credentials.

## Decisions

1. **Use OpenSpec as the planning contract.**
   - Decision: Keep implementation work gated by
     `openspec/changes/bootstrap-llm-wiki-mvp/` until archive.
   - Rationale: The project needs a durable contract outside chat history.
   - Alternative considered: continue from the exploration archive. Rejected
     because the archive contains private material, superseded docs, and too much
     context for a public implementation repo.

2. **Keep MVP TLDR-only.**
   - Decision: Support only TLDR newsletter ingestion in this change.
   - Rationale: The profile, labels, and holdout methodology are TLDR-trained.
   - Alternative considered: add RSS, YouTube, or broad Gmail ingestion now.
     Rejected because those sources have not been validated and add unrelated
     parser, privacy, and quality risks.

3. **Split profile, classifier mechanics, and routing.**
   - Decision: Use `schema/interest-profile.md`,
     `schema/classifier-instructions.md`, and `schema/routing-rules.md`.
   - Rationale: Interest content changes on a different cadence than output
     validation or route behavior.
   - Alternative considered: one monolithic prompt/spec file. Rejected because it
     encourages coupling downstream behavior back into classification.

4. **Classifier uses score-first classification and emits classification only.**
   - Decision: The model returns `interest_level`, `interest_score`,
     `consumption_depth`, `depth_score`, `signals`, and `reason`.
   - Decision: `interest_score` and `depth_score` are the continuous calibration
     values; `interest_level` and `consumption_depth` are labels derived from
     configured score bands. Application validation SHALL reject, quarantine, or
     normalize inconsistent score/label pairs according to the configured policy.
   - Rationale: Scores preserve near-boundary information for queue ordering,
     feedback review, blind validation, threshold tuning, and profile/prompt
     updates. Labels give routing code stable categories without scattering
     float-threshold logic through every consumer. Commute behavior, wiki ingest,
     stream-log placement, and review handling are consumers of classification,
     not classifier facts.
   - Alternative considered: let the model emit `voice_behavior`. Rejected
     because it couples one UX surface to the source-neutral classifier.

5. **Use provider-neutral adapters with one default daily scorer.**
   - Decision: Configure provider and model ids outside parser and routing code.
   - Decision: The classifier runtime SHALL support configurable batch size.
     Batch size may default to `1` while validation is immature, but larger
     batches are the planned cost/latency control once per-item validation and
     quarantine behavior are stable.
   - Rationale: Runtime scoring provider and implementation provider are separate
     choices. Batching reduces repeated profile/instruction tokens and request
     overhead; single-item calls reduce retry/quarantine blast radius while the
     schema is still proving itself.
   - Alternative considered: run Claude and OpenAI on every item and merge axes.
     Rejected for MVP because it doubles cost and introduces score-calibration
     complexity before product value is proven.

6. **Start with prepared commute queue, not custom voice.**
   - Decision: Generate a queue that Brad can use manually with ChatGPT, Claude,
     or equivalent voice review.
   - Rationale: The product question is whether classified TLDR items and
     deliberate notes are useful in the car. Custom realtime voice is a later
     integration question.
   - Alternative considered: build a custom realtime agent immediately. Rejected
     because it adds API, latency, turn-taking, tool-call, and privacy complexity
     before the queue proves useful.

7. **Store feedback labels as data.**
   - Decision: Corrections append structured labels with source id, original
     predicted scores/labels, corrected labels/routes where applicable, and
     version metadata.
   - Rationale: The `maybe` band is noisy, and per-item online profile edits
     would chase one-off reactions. Persisted scores let review distinguish
     near-boundary disagreements from high-confidence misses and make future
     threshold tuning possible without regenerating predictions.
   - Alternative considered: rewrite the profile after every correction.
     Rejected because it would destroy auditability and overfit unstable cases.

8. **Use file queues and GitHub Pages before UI or Cloudflare.**
   - Decision: Keep queue, review, source, feedback, and wiki outputs in
     reviewable files.
   - Rationale: The workflow should become painful in files before earning a
     custom UI.
   - Alternative considered: build an Astro/Cloudflare review app now. Rejected
     as too much surface area for the TLDR MVP.

## Risks / Trade-offs

- [Risk] Manual Gmail connector steps are slower than automation. -> Mitigation:
  preserve text-file fallback and defer unattended Gmail until the parser,
  classifier, and routing behavior are proven.
- [Risk] TLDR body parsing can misclassify sponsors or wrapper text. ->
  Mitigation: require body-marker confirmation, exclude known ad/wrapper
  sections, and fail ambiguous boundaries to review.
- [Risk] Model output may drift or include route-like fields. -> Mitigation:
  validate structured output, reject downstream behavior fields, and route
  invalid outputs to review.
- [Risk] Larger classifier batches can make one malformed model output affect
  several items. -> Mitigation: keep batch size configurable, start with small
  batches if needed, validate each returned record independently, and quarantine
  only the records or batch whose output cannot be reconciled to the input.
- [Risk] Feedback labels can contain private context. -> Mitigation: keep
  sensitive freeform notes out of public files and use sanitized labels or review
  placeholders where needed.
- [Risk] The July 3+ holdout can be contaminated by implementation fixtures. ->
  Mitigation: treat July 3, 2026 and later direct TLDR emails as validation data
  unless Brad explicitly changes the plan.
- [Risk] GitHub Pages publication can expose material too early. -> Mitigation:
  require approved source records and public-promotion review before compilation.

## Migration Plan

1. Create the schema files, compile state, model config example, and fixture
   directories.
2. Implement parser, batch-capable classifier validation, routing, queue,
   feedback, and wiki compile behavior against fixtures.
3. Run one real TLDR email end to end locally.
4. Use one prepared queue in a real car session or equivalent manual voice test.
5. Record at least one correction label.
6. Compile at least one approved source into the wiki.
7. Configure GitHub Pages and manual CI only after local tests pass.

Rollback is file-based: keep source records immutable, keep generated queues and
wiki output reviewable, and revert generated output or route questionable items
to review without deleting raw correction history.

## Open Questions

- Exact public/private split for committed `sources/` and `feedback/`; default is
  sanitized-public TLDR metadata and non-sensitive labels only.
- First runtime provider/API key for classification.
- Whether Node 24 remains the default runtime or Node 26 becomes acceptable after
  the Phase 0 runtime check.
- The exact OKF entry taxonomy for `wiki/` paths and frontmatter tags.
