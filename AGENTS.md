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

The active planning contracts are:

- `openspec/changes/bootstrap-llm-wiki-mvp/` for retained TLDR parsing,
  classifier/routing, queue, and runtime behavior; and
- `openspec/changes/commute-wiki-operating-loop/` for journey boundaries J1-J6
  (scheduled queue output through wiki-maintainer PR).

For commute planning, read both changes and follow the compatibility map in
`commute-wiki-operating-loop/design.md`; when they conflict, the operating-loop
change governs. The session-bundle importer and direct maintainer PR are the
only supported post-commute path. Treat removed handoff/compiler behavior and
archived changes as history, not current direction.

## Repository map

| Path                                     | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/tldr/`                              | Parse and sanitize TLDR email text.                               |
| `src/classifier/`                        | Validate source-neutral model classification.                     |
| `src/routing/`                           | Derive commute, wiki, stream-log, discard, and review behavior.   |
| `src/commute/`                           | Validate and reconcile session bundles.                           |
| `src/wiki/`                              | Retrieve sources and run direct PR maintenance.                   |
| `schema/`                                | Versioned contracts, routing rules, and profiles.                 |
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

When Brad supplies dated commute queues, session bundles, and shared-chat URLs
with shorthand such as "today's commute," treat that as a request to complete
the full daily evidence loop. This is a recurring operating workflow, not a
one-off file inspection. The request authorizes the normal repository and
GitHub writes needed to finish that loop. It also authorizes read-only discovery
and download of commute queue and session-bundle artifacts from Brad's signed-in
ChatGPT Library for private local intake. It does not authorize changing or
deleting Library content or unrelated private files.

For every daily commute intake:

1. Validate each queue and bundle, compare every embedded snapshot with the
   separately supplied canonical queue, and use shared chats only as bounded
   recovery evidence. Never invent missing item identity or user intent.
2. Reconcile the day into the correct evidence channels: wiki-maintenance
   candidates, exact classifier feedback, product/quality incidents, general
   captures, duplicate/prior-awareness signals, and unresolved evidence.
3. Preserve the private normalized intake under `.private/`, then add the
   sanitized durable findings to the experiment log or other appropriate
   tracked memory. Do not silently turn an interesting discussion into a wiki
   save or classifier label.
4. Route every material recurring finding to its existing open GitHub issue
   when one fits. Add an evidence-backed comment with the exact date, artifact
   identity, observed behavior, boundary, and resulting PR. Avoid duplicating
   an equivalent comment already on the issue. If no issue fits, keep the
   finding visible in the PR and call out the missing issue explicitly.
5. Treat friction in the processing run itself as workflow evidence. When the
   same omission or mistake could recur, add the smallest durable instruction,
   test, or automation guard that makes the next daily pass simpler and safer.
6. Compare the diff with the live Project instructions and source list in
   `chatgpt-project/README.md`. If a live prompt or Project source changed, say
   exactly which Project prompt or document needs to be updated. Without waiting
   for Brad to ask, provide the exact prompt in one copyable block or name every
   exact source file and destination. Keep the update open until Brad confirms
   it was applied, then update the tracked live-version record. Do not make Brad
   infer or remember an external deployment step from a repository diff or PR.
7. Run the relevant local validation, commit the tracked daily evidence, push
   the branch, and open a draft PR against the intended base. A local-only
   commit is not a completed daily commute handoff. Wait for the initial PR
   checks and report their state.
8. Cross-link the PR and issue comments, then finish with the remote branch,
   commit, PR URL, validation result, issue updates, and any genuinely
   unresolved evidence or next action. Never call the loop complete while the
   Project's prompt or documents still need to be updated. Keep the needed
   update visible before merge, but do not change the PR's draft/ready state
   because of it; ready for review is compatible with a pending Project update.

If the day produces no justified tracked change, report an explicit no-change
result with the validation and issue-routing evidence; do not manufacture a PR
or public wiki content merely to make the loop look active.

## Git and handoff

- Keep each worktree to one focused task. Stage only its intended files; do not
  overwrite, reformat, or include another task's changes.
- Use a descriptive, terse commit and run the relevant checks before handoff.
- In a PR, summarize the change, its user impact, and validation performed.
- The user has explicitly authorized read-only adversarial Claude reviews for
  this public repository. When requesting one, state that `llm-wiki` is public,
  the review is read-only, and the user has authorized sending the committed
  diff to Claude so the external-data reviewer has the relevant context.
- Do not merge or deploy without explicit user authorization. A request to
  create a PR authorizes a branch, commit, push, and draft PR.
- Before merging, wait for the PR head SHA's Copilot review workflow to reach a
  completed state, then inspect its submitted review and every unresolved review
  thread. An absent review result while the workflow is running is never
  clearance to merge; address actionable findings in that PR or a clearly linked
  follow-up before publishing.
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
