# Next Session Handoff

Date: 2026-07-05

## Current State

- Work is on branch `codex/bootstrap-llm-wiki-mvp`.
- This branch contains the repo bootstrap and OpenSpec planning baseline only.
- No application code has been implemented yet.
- The active OpenSpec change is `bootstrap-llm-wiki-mvp`.
- The OpenSpec artifacts live under
  `openspec/changes/bootstrap-llm-wiki-mvp/`.
- The change has been validated with:

```bash
openspec validate bootstrap-llm-wiki-mvp --type change --strict
```

## Key Files

- `openspec/changes/bootstrap-llm-wiki-mvp/proposal.md`
- `openspec/changes/bootstrap-llm-wiki-mvp/design.md`
- `openspec/changes/bootstrap-llm-wiki-mvp/tasks.md`
- `openspec/changes/bootstrap-llm-wiki-mvp/specs/`
- `AGENTS.md`
- `docs/source-synthesis.md`

## Next Step

After the planning PR is reviewed and merged, continue with the next OpenSpec
step:

```text
/opsx:apply bootstrap-llm-wiki-mvp
```

That should start implementation from `tasks.md`. The first implementation work
should be the schema foundation:

1. Create `schema/interest-profile.md` v1.4.
2. Create `schema/classifier-instructions.md`.
3. Create `schema/routing-rules.md`.
4. Initialize `schema/compile-state.json`.
5. Add model config and fixture directories.

## Guardrails

- Do not commit directly to `main`.
- Do not copy the outer exploration archive into this repo.
- Keep the MVP TLDR-only.
- Keep classifier output source-neutral; routing belongs in app code.
- Preserve July 3, 2026 and later TLDR emails as the next clean validation
  holdout unless Brad explicitly changes that decision.
- Defer RSS, YouTube, Cloudflare Workers, review UI, unattended Gmail automation,
  custom Realtime voice, and daily dual-provider ensembles.

