# Next Session Handoff

Date: 2026-07-12

## Current State

- Work is on branch `bootstrap-tldr-ingestion`.
- The active OpenSpec change remains `bootstrap-llm-wiki-mvp`.
- Schema foundation, runtime setup, and TLDR ingestion tasks are implemented.
- The TLDR ingestion implementation, incremental ChatGPT Voice replan,
  commute-handoff importer, and OKF/Pages scaffold are committed as `e0ddb5a`.
- The manual ChatGPT Project workflow has successfully used the Gmail connector
  to classify a TLDR newsletter, created a JSON queue in a `.txt` Library file,
  and played that queue in ChatGPT Voice.
- The private `commute-handoff.v1` importer has passed a synthetic at-home dry
  run. The first real post-commute import is still pending.
- The approved-source compiler, provenance-preserving update behavior, and
  compile-state tracking are implemented and fixture-tested. No real approved
  source has been compiled yet.
- The public GitHub Pages setting is not enabled.

## Current Priority

1. Use the prepared queue and structured handoff in Monday's real commute.
2. Download the generated `YYYYMMDD-tldr-commute-handoff.txt` at home and run
   `npm run import:commute-handoff -- --input <downloaded-file>`.
3. Use the normal quality gate to review and merge the current branch.
4. Run the documented first real wiki ingestion test in
   `docs/wiki-ingestion-test.md`.
5. Enable the GitHub Pages read path only after the real local wiki output and
   branch are reviewed.
6. Resume provider-neutral classifier and deterministic queue automation after
   the Monday manual loop is proven.

## Key Files

- `openspec/changes/bootstrap-llm-wiki-mvp/`
- `docs/replan-2026-07-12.md`
- `docs/commute-voice-handoff.md`
- `schema/commute-handoff-v1.schema.json`
- `schema/approved-wiki-source-v1.schema.json`
- `src/commute/handoff.ts`
- `src/commute/import-handoff.ts`
- `src/wiki/`
- `docs/wiki-ingestion-test.md`
- `wiki/`
- `index.md`
- `_config.yml`

The active ChatGPT Project instruction sources are grouped under
`chatgpt-project/`, with the handoff JSON contract under
`schema/commute-handoff-v1.schema.json`.

## Verification

The latest completed pass used:

```bash
npm run check
openspec validate bootstrap-llm-wiki-mvp --type change --strict
npm run import:commute-handoff -- \
  --input tests/fixtures/commute/valid-handoff.txt \
  --output-dir /tmp/llm-wiki-handoff-dryrun-20260712
npm run compile:wiki -- \
  --repo-root /tmp/llm-wiki-compile-test-20260712b \
  --input sources/tldr/2026-07-12-context-engineering.txt
```

All checks passed. OpenSpec progress after the compiler block is 24/52 tasks complete;
the real commute/import task remains pending.

## Guardrails

- Do not commit directly to `main`.
- Do not commit `.private/` or a full Voice transcript.
- Keep Range.com detail, raw Gmail bodies, credentials, and sensitive freeform
  notes out of the public repo.
- Treat ChatGPT-generated queues as a manual adapter, not classifier ground
  truth.
- Do not mark the real-source ingestion or public Pages tasks complete merely
  because the compiler and local scaffold exist.
- Keep custom Realtime/GPT Live API voice, unattended Gmail, RSS, YouTube,
  Cloudflare Workers, review UI, and daily dual-provider scoring deferred.
