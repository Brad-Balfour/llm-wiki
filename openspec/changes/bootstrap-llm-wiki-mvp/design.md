## Context

The implementation repo is the public project surface. A separate local exploration archive remains private and is not part of this repository.

The repo already has OpenSpec initialized for Codex, GitHub Copilot, and Claude Code, but this change is the first real OpenSpec proposal pass for the MVP.

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

4. **Classifier uses score-first source-neutral output.**
   - Decision: The model returns `interest_level`, `interest_score`,
     `consumption_depth`, `depth_score`, `signals`, `reason`, and an opaque
     `classifier_item_id` used only to reconcile batched outputs.
   - Decision: `interest_score` and `depth_score` are the continuous calibration
     values; `interest_level` and `consumption_depth` are labels derived from
     configured, gap-free score bands. Application validation SHALL reject,
     quarantine, or normalize inconsistent score/label pairs according to the
     configured policy.
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
     batches are the planned cost/latency control once per-item validation,
     source-neutral item-id reconciliation, and quarantine behavior are stable.
   - Rationale: Runtime scoring provider and implementation provider are separate
     choices. Batching reduces repeated profile/instruction tokens and request
     overhead; single-item calls reduce retry/quarantine blast radius while the
     schema is still proving itself.
   - Alternative considered: run Claude and OpenAI on every item and merge axes.
     Rejected for MVP because it doubles cost and introduces score-calibration
     complexity before product value is proven.

6. **Start with prepared commute queue, not custom voice.**
   - Decision: Generate a sanitized queue that Brad can use manually with
     ChatGPT Voice, preferring GPT Live when it is available to the current
     consumer account, Claude, or an equivalent voice workflow. The first car
     validation SHALL work with a Tesla Model 3 phone-based workflow and SHALL
     not assume a specific in-dash integration.
   - Rationale: The product question is whether classified TLDR items and
     deliberate notes are useful in the car. GPT Live improves the manual
     ChatGPT experience, but its API is not an MVP dependency; custom realtime
     voice remains a later integration question.
   - Alternative considered: build a custom realtime agent immediately. Rejected
     because it adds API, latency, turn-taking, tool-call, and privacy complexity
     before the queue proves useful. Reconsider a GPT Live API integration only
     in a later OpenSpec change after its public API contract is available.

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

9. **Use tests and independent pre-PR review as implementation gates.**
   - Decision: For deterministic parser, validation, routing, queue, feedback,
     and compiler behavior, implementation PRs SHOULD start from focused tests
     or add tests alongside the production code when strict test-first sequencing
     is not practical.
   - Decision: Before opening or updating a PR for review, run the relevant
     local checks and then run an independent review of the diff and OpenSpec
     requirements using a separate Codex subagent or local Claude.
   - Decision: GitHub Codex/Copilot review is the external PR review layer, not
     the first review pass.
   - Rationale: The project is prompt- and data-contract-heavy, so many failures
     are integration or contract drift failures. Focused tests catch deterministic
     behavior regressions, while a separate reviewer catches requirement misses
     before the PR review cycle.
   - Alternative considered: rely on GitHub Codex review after PR creation.
     Rejected because review comments then become the first quality gate instead
     of a final check.

10. **Borrow local repo conventions where practical.**
   - Decision: When adding or revising implementation tooling, scripts, linting,
     formatting, TypeScript settings, ignore rules, and repository workflow
     conventions, prefer applicable patterns already used by the local sibling
     repos `../bradbalfour-dot-com` and `../bradbalfour-photography`.
   - Decision: Apply those conventions selectively. Keep this repo Node/TLDR
     focused and do not import Astro, browser, Playwright, Cloudflare, image
     pipeline, or other frontend-specific configuration unless a later OpenSpec
     change promotes that surface area.
   - Rationale: The sibling repos encode Brad's current working conventions for
     JavaScript/TypeScript project maintenance. Reusing those patterns reduces
     friction and avoids inventing a different house style for this project.
   - Alternative considered: choose fresh defaults independently for `llm-wiki`.
     Rejected because it creates needless inconsistency across Brad's local
     projects.

11. **Treat the successful ChatGPT Project workflow as a manual adapter.**
   - Decision: For the Monday commute prototype, a ChatGPT Project may hold the
     interest profile, classifier instructions, queue contract, and car-reader
     prompt; a project chat may use the Gmail connector to classify a confirmed
     TLDR newsletter and create an ordered JSON queue stored in a `.txt` file.
   - Decision: This manual path may run before tasks 4.1-5.3 are implemented in
     the repository, but it does not satisfy or remove those deterministic
     runtime tasks.
   - Rationale: The workflow has now succeeded end to end through queue playback
     in a real voice session, so it can answer the product question sooner than
     the automated runtime.
   - Alternative considered: keep automated classification and queue generation
     as blockers for the next commute test. Rejected because it would delay use
     of a working manual product slice without reducing implementation risk.

12. **Use JSON content in TXT as the post-commute handoff.**
   - Decision: At session end, the same project chat creates a
     `commute-handoff.v2` object containing only explicit feedback, saved review
     notes, queue/session identity, structured per-queue completion or resume
     state, and material recognition issues. The Library transport file uses
     `.txt`; its content is JSON. The local importer remains compatible with v1.
   - Decision: Explicit actions and material queue-state changes append to a
     structured internal ledger during the commute. Handoff generation reloads
     authoritative queues, ledger, instructions, and schema; validates during
     the current generation pass; and writes a new revision rather than relying
     on conversational reconstruction or replacing an earlier artifact.
   - Decision: A local importer validates the object, rejects unknown top-level
     fields such as `transcript`, and writes create-only normalized data under a
     gitignored private directory.
   - Rationale: TXT is explicitly supported by ChatGPT file workflows, while
     JSON upload behavior is less clear in the observed product surface. The
     structured object is more useful and safer than relying on a non-verbatim
     full voice transcript.
   - Alternative considered: copy the entire post-session transcript into the
     repository. Rejected because transcripts may be imperfect and can contain
     private, incidental, or unnecessary content.

13. **Pull OKF scaffold and handoff ahead of classifier automation.**
   - Decision: The current implementation priority is (1) initial reviewed OKF
     wiki/read-path scaffold, (2) Monday-ready commute handoff and dry run, (3)
     finish and merge the existing TLDR ingestion branch, (4) compile one
     approved source, and then (5) resume provider-neutral classification and
     deterministic queue automation.
   - Rationale: This sequence closes the durable product loop around the proven
     manual workflow while preserving the automated architecture as the intended
     replacement.

14. **Require local safety confirmation and safe public rendering.**
   - Decision: A ChatGPT-authored `public: true` value is necessary but not
     sufficient for compilation. The source contract also records cleared
     privacy, publication-rights, and dual-use review, and the local compiler
     requires an explicit `--confirm-public` flag.
   - Decision: Public source URLs must be credential-free HTTP(S), public text
     fields must reject raw HTML, Markdown links, private-work markers, control
     characters, and credential-like material, and rendered plain text is
     Markdown-escaped.
   - Decision: Reuse of a stable source item id is idempotent only when the full
     provenance identity—item id, immutable source path, and URL—matches. A
     collision with different provenance fails closed.
   - Rationale: The repository must enforce its public-promotion boundary
     independently of model output and must never silently lose provenance.

15. **Validate the static-site source before Pages deployment.**
   - Decision: Keep Prettier and ESLint in the Node project checks, add a direct
     YAML parser that validates Jekyll configuration and Markdown frontmatter,
     and keep the GitHub Pages Jekyll build as the renderer-level check.
   - Rationale: Prettier catches malformed YAML syntax while formatting, but it
     does not verify required frontmatter shape or compatibility with the wiki
     compiler. A deterministic Node check catches those failures before the
     remote Jekyll build without adding a second local Ruby toolchain.

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
  batches if needed, validate each returned record independently, reconcile by
  source-neutral classifier item ids instead of array position, and quarantine
  only the records or batch whose output cannot be reconciled to the input.
- [Risk] Feedback labels can contain private context. -> Mitigation: keep
  sensitive freeform notes out of public files and use sanitized labels or review
  placeholders where needed.
- [Risk] The July 3+ holdout can be contaminated by implementation fixtures. ->
  Mitigation: treat July 3, 2026 and later direct TLDR emails as validation data
  unless Brad explicitly changes the plan.
- [Risk] GitHub Pages publication can expose material too early. -> Mitigation:
  require approved source records and public-promotion review before compilation.
- [Risk] GitHub PR review can catch avoidable issues late. -> Mitigation: require
  local checks plus an independent Codex subagent or local Claude review before
  opening the PR or requesting GitHub Codex review.
- [Risk] ChatGPT-created queue output can drift from the repo's classifier and
  routing contracts. -> Mitigation: include the same versioned project source
  files, preserve source ids and metadata, validate the handoff independently,
  and treat the manual adapter as temporary rather than classifier truth.
- [Risk] Voice transcripts can be incomplete or contain private incidental
  speech. -> Mitigation: ingest only an explicit structured end-of-session
  handoff and keep it private until reviewed.

## Migration Plan

1. Create the schema files, compile state, model config example, and fixture
   directories.
2. Establish the reviewed OKF wiki scaffold and private commute-handoff contract
   so the proven manual ChatGPT workflow can be exercised on the next commute.
3. Implement parser, batch-capable classifier validation, routing, queue,
   feedback, and wiki compile behavior against fixtures. The manual ChatGPT
   adapter may be used before classifier/queue automation is complete.
4. Reuse applicable local repo conventions from `../bradbalfour-dot-com` and
   `../bradbalfour-photography` when adding or changing project tooling.
5. Run one real TLDR email end to end locally.
6. Use one prepared queue in a real car session or equivalent manual voice test,
   then import the structured post-session handoff.
7. Record at least one correction label.
8. Compile at least one approved source into the wiki.
9. Run local checks and an independent pre-PR review before opening or updating
   each implementation PR for GitHub review.
10. Configure GitHub Pages and manual CI only after local tests pass.

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
