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
wiki. Exact commute `wiki_this` captures authorize the maintainer to propose
wiki changes directly in a PR; do not invent review queues, permissions,
attestations, or confirmation flags.

Current requirements live with the system they govern: schemas and focused
tests define artifact contracts, source and tests define deterministic behavior,
`chatgpt-project/` defines Project and Voice behavior, and focused runbooks
define operator procedures. The session-bundle importer and direct maintainer
PR are the only supported post-commute path. Treat removed handoff/compiler
behavior as history, not current direction.

## Repository map

| Path                                     | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/tldr/`                              | Normalize TLDR newsletter text and extract editorial items.       |
| `src/classifier/`                        | Validate source-neutral model classification.                     |
| `src/routing/`                           | Derive commute, wiki, stream-log, discard, and review behavior.   |
| `src/commute/`                           | Validate and reconcile session bundles.                           |
| `src/wiki/`                              | Retrieve sources and run direct PR maintenance.                   |
| `schema/`                                | Versioned contracts, routing rules, and profiles.                 |
| `wiki/`                                  | GitHub Pages content and entry template.                          |
| `tests/fixtures/` and `tests/`           | Node test fixtures and focused contract coverage.                 |
| `docs/` and `chatgpt-project/`           | Operator runbooks and project prompts; keep commands accurate.    |
| `.claude/`, `.codex/`, `.github/skills/` | Agent-specific workflow instructions.                            |

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

## Planning substantial work

Use GitHub issues for planned work and keep plans proportional to the risk. A
small bug may need only a clear outcome and regression test. Before substantial
or uncertain implementation, record the relevant parts of this structure in an
issue or focused runbook:

1. problem or opportunity and evidence;
2. intended user-visible or operational outcome;
3. included work and affected files;
4. constraints and behavior that must not regress;
5. alternatives or decisions still requiring resolution;
6. explicit non-goals;
7. ordered implementation steps;
8. automated tests and manual checks;
9. acceptance criteria; and
10. dependencies, follow-ups, or questions that require Brad's decision.

Do not create a parallel master specification. Update the stable owner when a
requirement changes, and use the issue and pull request for planning and history.

`dist/`, `node_modules/`, coverage output, and `.private/` are generated or
local-only. Do not edit or commit them.

When changing runtime tooling, scripts, linting, formatting, TypeScript options,
ignore rules, or repository workflow conventions, first inspect applicable
patterns in the sibling `bradbalfour-dot-com` and `bradbalfour-photography`
repositories. Borrow only patterns that fit this Node/Jekyll pipeline; do not
import Astro, browser, Playwright, Cloudflare, or frontend configuration unless
the task introduces that surface.

## Planning and implementation handoffs

Write practical runbooks that another coding model can execute without reading
past conversations. Separate existing behavior from proposed changes. Number
requirements in reading order and update references when reorganizing them.
For each phase, name tasks, exact files, PR outputs/dependencies, the agent’s work,
Brad’s steps, manual validation, deployment timing and completion criteria.

Prepare independent work and stacked PRs while Brad is unavailable; do not wait
for earlier merges to begin later coding. State exactly which results depend on
his answers or approval. Make validation proportional to the actual product
risk and Brad’s acceptance criteria. Preserve the working production environment;
do not introduce a second system just to make testing more elaborate.

Keep only decisions and evidence useful for implementation, faster improvement
or preventing repeat mistakes. Do not catalogue abandoned reasonable approaches
or turn a proposed experiment into an ongoing requirement. Every live Project
change must identify the exact version-controlled files to replace or restore,
using the existing installation-confirmation procedure.

## Implementation rules

- Use plain, direct language in user-facing updates and durable documentation.
  Name the actual file, check, program, or action. Avoid abstract shorthand such
  as “live-sync action,” “migration boundary,” or “downstream store” when a
  simple sentence can say exactly what happened and what, if anything, needs to
  be done.
- Keep raw credentials, API keys, `.env` contents, raw Gmail bodies, and private
  work material out of Git.
- Preserve stable source identifiers and article URLs in wiki provenance.
- Keep classifier output source-neutral. It must not emit routes,
  `voice_behavior`, wiki destinations, review choices, or discard behavior.
  Derive those in `src/routing/` according to `schema/routing-rules.md`.
- Validate structured model output and handle malformed output explicitly. Do
  not silently drop records or invent values.
- Parser, classifier, routing, queue, feedback, and maintainer changes need
  focused fixtures and tests. Update the schema and operator documentation when
  a contract or CLI changes.
- Preserve idempotence and provenance in ingestion and maintenance paths.
- Keep public Markdown compatible with GitHub Pages/Jekyll.
- LLM enrichment may be optional, but deterministic URL and source ingestion
  must not require an API key or a paid model.

## Recurring daily commute processing

When Brad asks to process a daily commute, use
[the process-daily-commute skill](.codex/skills/process-daily-commute/SKILL.md).
The skill owns intake, retrieval, reconciliation, publication gates, Project
synchronization, and cleanup. Keep those procedures in the skill so they have
one source of truth.

A daily commute request authorizes the repository and GitHub writes needed to
complete the run, merging a qualifying content PR after its required checks and
reviews pass, and synchronizing required live ChatGPT Project prompts or source
documents from the verified repository version. It also authorizes read-only
discovery and download of commute queues, validated v4 references, and session
bundles from Brad's signed-in ChatGPT Library for private intake.

Brad has granted standing authorization to delete the exact queue, validated
v4-reference, and session-bundle artifacts consumed by a durably completed
commute run after its PR merges, or after a complete no-change handoff when no
PR was needed. This covers matching transient copies in ChatGPT Library, the
LLM-Wiki-Car Project Library, and Downloads without another confirmation. It
does not cover chats, prompts, unrelated Project source documents, schemas,
normalized `.private/` intake, or artifacts whose completed-use evidence is
ambiguous.

## Git and handoff

- Keep each worktree to one focused task. Stage only its intended files; do not
  overwrite, reformat, or include another task's changes.
- Use a descriptive, terse commit and run the relevant checks before handoff.
- In a PR, summarize the change, its user impact, and validation performed.
- The user has explicitly authorized read-only adversarial Claude reviews for
  this public repository. When requesting one, state that `llm-wiki` is public,
  the review is read-only, and the user has authorized sending the committed
  diff to Claude so the external-data reviewer has the relevant context.
- Do not merge or deploy without explicit user authorization. Invoking the
  recurring commute workflow supplies that authorization for its qualifying
  content PR and required live Project synchronization, except that agent
  instruction and commute-policy changes require Brad's review before merge.
  Otherwise, a request to create a PR authorizes only a branch, commit, push,
  and review-ready PR unless a genuine
  unfinished item requires draft status.
- Apply the commute publication risk tiers in the skill before requesting or waiting
  for general-purpose AI review. When a review is required, wait for the latest
  head's review workflow to complete, inspect submitted reviews and unresolved
  threads, and address actionable findings in that PR or a clearly linked
  follow-up before publishing.
- After opening or updating a PR, wait for required checks and apply the commute
  risk tiers in the skill. Immediately before any merge, refresh submitted reviews
  and all unresolved inline threads at the current head; never rely on a
  previous snapshot while review is still arriving. Inspect unresolved review
  threads. A documentation-only or
  mechanical review fix does not trigger another general-purpose review round;
  do not hold an otherwise merge-ready PR for an unrequired review.
- After addressing a PR review comment, reply in that thread with the fix and
  validation evidence, then resolve the thread. The user has given standing
  authorization for this review follow-through; do not leave fixed comments
  merely outdated and unresolved.

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
