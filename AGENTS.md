# Agent Instructions

## Purpose

This repo implements a personal LLM knowledge base and TLDR ingestion pipeline.
Use the OpenSpec artifacts under `openspec/changes/bootstrap-llm-wiki-mvp/` as
the active planning contract until the change is archived.

## Project Rules

- Keep the outer parent folder as the exploration archive. Do not copy the full
  `codex-docs/`, `claude-docs/`, or `gemini-synthesis-docs/` trees into this
  public implementation repo unless explicitly requested.
- Treat `sources/` as immutable once created. Corrections should create new
  labels or metadata, not rewrite source files.
- The classifier must emit source-neutral classification only. It must not emit
  downstream-specific behavior such as `voice_behavior`.
- Commute behavior, wiki routing, review queue placement, and stream-log
  behavior belong in application routing code.
- Do not commit API keys, raw Gmail bodies, private Range.com notes, or sensitive
  voice-note content.
- Treat public placement as an explicit promotion step. Do not rush source data,
  feedback labels, voice notes, or generated wiki entries into public locations
  when local/private review is more appropriate.
- Consider dual-use implications for technical content. If an item could enable
  abuse, expose sensitive operational detail, or create work/privacy risk, route
  it to review instead of publishing it automatically.
- Use TypeScript/Node for MVP implementation unless an OpenSpec design update
  records a different decision.
- Prefer small, fixture-backed changes. Add or update tests when changing parser,
  classifier schema, routing, queue, feedback, or OKF compilation behavior.

## Current Stack Decisions

- Planning workflow: OpenSpec.
- Agent integrations: Codex, GitHub Copilot, Claude Code.
- Runtime stack: TypeScript/Node.
- Default Node target: research Node 26 during Phase 0, but default to Node 24
  while Node 26 is still Current rather than Active LTS.
- Read path: GitHub Pages for MVP.
- Cloudflare: deferred until review/admin UI or Workers are needed.

## Verification Expectations

Before implementation work is considered done:

- OpenSpec tasks should be checked off only when their acceptance criteria are
  satisfied.
- Schema and routing behavior should have fixture coverage.
- LLM-backed writes must validate structured output and fail closed to review.
- Generated wiki entries must preserve source provenance.
