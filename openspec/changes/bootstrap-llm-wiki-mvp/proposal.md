## Why

`llm-wiki` needs its first real OpenSpec contract before implementation starts.
The MVP should prove the TLDR classification, routing, commute, feedback, and
wiki loop from the validated exploration work without importing the private
archive or superseded assumptions into the public implementation repo.

## What Changes

- Establish a TLDR-only MVP with connector-assisted Gmail/TLDR discovery first
  and text-file fallback.
- Define production profile files under `schema/`: v1.4 interest profile,
  classifier instructions, routing rules, compile state, and model config
  example.
- Require the classifier to emit only source-neutral interest and depth
  classification, never downstream behavior such as `voice_behavior`.
- Derive commute, wiki, stream-log, review, and discard behavior in application
  routing code.
- Generate a prepared, sanitized commute queue for manual ChatGPT Voice
  (prefer GPT Live when available), Claude, or equivalent review before any
  custom voice agent.
- Allow a ChatGPT Project to act as a manual MVP adapter for connector-assisted
  TLDR classification and queue-file creation while the provider-neutral repo
  runtime is still being built.
- Import a self-contained post-commute session bundle into private local
  reconciliation; do not ingest a full voice transcript.
- Store feedback corrections as labels and use cadenced profile patches instead
  of rewriting the profile from each correction.
- Maintain OKF-style Markdown with stable source identity and URLs through
  reviewable PRs, with GitHub Pages as the read path.
- Preserve July 3, 2026 and later TLDR emails as the next clean validation
  holdout unless Brad explicitly changes that decision.
- Require focused tests where behavior is deterministic and an independent
  pre-PR review by a Codex subagent or local Claude before requesting GitHub
  Codex review.
- Defer RSS, YouTube, Cloudflare Workers, review UI, unattended Gmail automation,
  daily dual-provider ensembles, and custom Realtime or GPT Live API voice.

## Capabilities

### New Capabilities

- `tldr-ingestion`: Confirm TLDR editions, extract non-sponsor editorial items,
  support manual connector-assisted Gmail discovery and text-file fallback, and
  protect validation holdouts.
- `classifier-routing`: Define the profile/classifier/routing split, validate
  source-neutral classifier output, configure provider-neutral model use, and
  derive downstream routes in application code.
- `commute-queue`: Produce a prepared queue ordered by interest/depth priority
  for manual voice review. The successor operating-loop change governs current
  session-bundle capture and post-commute maintenance.
- `feedback-labels`: Store interest, depth, and routing corrections as structured
  label data, preserve blind-validation methodology, and use product-harm review
  for future profile updates.

### Modified Capabilities

None. This is the first OpenSpec proposal pass for the implementation repo.

## Impact

- Affects TypeScript/Node application code for TLDR parsing, classification,
  routing, queues, and feedback. Current wiki maintenance is governed by the
  successor operating-loop change.
- Adds no application code in this proposal pass.
- Adds a quality gate for future implementation PRs: local checks, focused
  tests/TDD where appropriate, and independent review before GitHub PR review.
- Establishes privacy and safety constraints for public repo content: no API
  keys, raw Gmail bodies, private Range.com notes, sensitive voice-note content,
  or unreviewed public promotion.
- Sets `openspec/changes/bootstrap-llm-wiki-mvp/` as the active planning contract
  until the change is implemented and archived.
