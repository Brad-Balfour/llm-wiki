# LLM Wiki Agent Guide

## Workspace and worktree policy

This workspace has two layers:

- The implementation repository is `repo/`. Begin all repository work with
  `cd repo`; it is the only directory agents may edit unless the user explicitly
  requests otherwise.
- The directory above `repo/` is a historical research archive. Do not edit it
  or copy its `codex-docs/`, `claude-docs/`, or `gemini-synthesis-docs/` trees
  into the implementation repository unless explicitly requested.

Before making any write, create a new isolated worktree inside `repo/worktrees/`.
Keep the primary `repo/` checkout clean on `main`; never implement work directly
there. From `repo/`, use this pattern (replace `<task>` with a short slug):

```bash
git fetch origin
git worktree add -b agent/<task> worktrees/<task> origin/main
cd worktrees/<task>
```

For an existing branch, use `git worktree add worktrees/<task> <branch>`.
Inspect `git worktree list` and `git status --short --branch` before editing.
Do not share, reuse, or clean up another agent's worktree without explicit user
direction.

## Project

`llm-wiki` is a personal, Karpathy-style OKR and memory wiki with a TLDR
ingestion pipeline. It saves useful knowledge and publishes the GitHub Pages
wiki. A named `ingest:*` or `compile:wiki` command is authorization to make its
intended wiki updates; do not invent review queues, permissions, attestations,
or confirmation flags.

The active planning contracts are:

- `openspec/changes/bootstrap-llm-wiki-mvp/` for retained TLDR parsing,
  classifier/routing, queue, compiler, and runtime behavior; and
- `openspec/changes/commute-wiki-operating-loop/` for journey boundaries J1-J6
  (scheduled queue output through wiki-maintainer PR).

For J1-J6 planning and opt-in successor implementation work, read both changes
and follow the compatibility map in `commute-wiki-operating-loop/design.md`;
when they conflict, the successor change governs the new path. Bootstrap v1/v2
handoffs and the current compiler remain the deployed/runtime default and
legacy-compatible until the successor's stated migration criteria pass.
Treat archived changes as history, not current direction.

## Repository map

| Path                                     | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/tldr/`                              | Parse and sanitize TLDR email text.                               |
| `src/classifier/`                        | Validate source-neutral model classification.                     |
| `src/routing/`                           | Derive commute, wiki, stream-log, discard, and review behavior.   |
| `src/commute/`                           | Import and validate commute handoffs.                             |
| `src/wiki/`                              | Validate sources and compile provenance-preserving wiki pages.    |
| `schema/`                                | Versioned contracts, routing rules, profiles, and compiler state. |
| `sources/`                               | Sanitized source records.                                         |
| `wiki/`                                  | GitHub Pages content and entry template.                          |
| `tests/fixtures/` and `tests/`           | Node test fixtures and focused contract coverage.                 |
| `docs/` and `chatgpt-project/`           | Operator runbooks and project prompts; keep commands accurate.    |
| `.claude/`, `.codex/`, `.github/skills/` | OpenSpec integrations; use the matching workflow when it applies. |

## Environment and commands

- Use Node 24 and npm 11 (`.nvmrc`, `.node-version`, and `package.json` are the
  source of truth). Do not casually change the runtime range.
- Install locked dependencies with `npm run ci:install`.
- Type-check/build: `npm run build`.
- Run tests: `npm test`.
- Lint: `npm run lint`.
- Check formatting: `npm run format:check`.
- Validate the Jekyll content: `npm run validate:site`.
- Run the complete local gate for implementation changes: `npm run check`.
- For an active OpenSpec change, run strict validation for every change whose
  requirements are touched. J1-J6 work normally validates both
  `bootstrap-llm-wiki-mvp` and `commute-wiki-operating-loop`.

`dist/`, `node_modules/`, coverage output, and `.private/` are generated or
local-only. Do not edit or commit them.

When changing runtime tooling, scripts, linting, formatting, TypeScript options,
ignore rules, or repository workflow conventions, first inspect applicable
patterns in the sibling `bradbalfour-dot-com` and `bradbalfour-photography`
repositories. Borrow only patterns that fit this Node/Jekyll pipeline; do not
import Astro, browser, Playwright, Cloudflare, or frontend configuration unless
the task introduces that surface.

## Implementation rules

- Keep raw credentials, API keys, `.env` contents, raw Gmail bodies, and private
  work material out of Git.
- Preserve source provenance and stable identifiers. In normal operation, avoid
  rewriting an existing source record; make a deliberate schema migration
  explicit in its OpenSpec change and tests.
- Keep classifier output source-neutral. It must not emit routes,
  `voice_behavior`, wiki destinations, review choices, or discard behavior.
  Derive those in `src/routing/` according to `schema/routing-rules.md`.
- Validate structured model output and handle malformed output explicitly. Do
  not silently drop records or invent values.
- Parser, classifier, routing, queue, feedback, and compiler changes need
  focused fixtures and tests. Update the schema and operator documentation when
  a contract or CLI changes.
- Preserve idempotence and provenance in ingestion and compilation paths.
- Keep public Markdown compatible with GitHub Pages/Jekyll.
- LLM enrichment may be optional, but deterministic URL and source ingestion
  must not require an API key or a paid model.

## Git and handoff

- Keep each worktree to one focused task. Stage only its intended files; do not
  overwrite, reformat, or include another task's changes.
- Use a descriptive, terse commit and run the relevant checks before handoff.
- In a PR, summarize the change, its user impact, and validation performed.
- Do not merge or deploy without explicit user authorization. A request to
  create a PR authorizes a branch, commit, push, and draft PR.
- Before merging, wait for the PR head SHA's Copilot review workflow to reach a
  completed state, then inspect its submitted review and every unresolved review
  thread. An absent review result while the workflow is running is never
  clearance to merge; address actionable findings in that PR or a clearly linked
  follow-up before publishing.

## Failure-driven improvements

When an error escapes local validation, reaches CI, or affects the user-facing
workflow, propose and—when approved—implement the smallest durable guard that
would have caught it before the same boundary. Do not treat the remediation as
complete until that guard is covered by a focused test or local command and, for
publish-affecting changes, by a pull-request CI check.

## Instruction compatibility

`AGENTS.md` is the canonical repository guide. `CLAUDE.md` is a symbolic link
to this file so Claude Code receives the same instructions. Update this file,
not the link.
