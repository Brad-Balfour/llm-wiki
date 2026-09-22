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
| `src/tldr/`                              | Parse and sanitize TLDR email text.                               |
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

## Commute publication policy

Keep the PR as the publication record, review boundary, rollback point, and
Pages trigger. Make review proportional to risk rather than adding automatic
general-purpose review rounds.

- Content- and evidence-only daily publication relies on deterministic gates.
  The request to run the recurring commute workflow authorizes merging its
  qualifying PR after those gates pass. Do not require a general-purpose AI
  review unless a gate or maintainer identifies ambiguity.
- Routine generated provenance or state updates use deterministic gates first.
  Require at most one latest-head review when repository policy or a maintainer
  requires it.
- Code, schema, routing, prompt, workflow, or other behavior changes receive
  one review of the latest complete head after local checks.
- Batch findings from one review round into one fix commit. Request another
  full review only when that fix materially changes behavior or invalidates the
  earlier review; documentation-only or mechanical fixes do not restart it.

Keep a commute PR limited to the day’s evidence and the smallest directly
necessary guard. Put substantial workflow refactors, historical cleanup, and
unrelated product work in linked follow-up issues instead of extending the
daily critical path.

Use brief, non-interrupting milestone updates: intake validated (including a
genuine evidence problem), PR ready (including checks and any action Brad must
take), and merged and finished or concretely blocked. Do not request an
acknowledgment or narrate routine tool calls and unchanged polling state.

## Recurring daily commute processing

When Brad supplies dated commute queues, session bundles, and shared-chat URLs
with shorthand such as "today's commute," treat that as a request to complete
the full daily evidence loop. This is a recurring operating workflow, not a
one-off file inspection. The request authorizes the normal repository and
GitHub writes needed to finish that loop, merging its qualifying PR after
required checks and reviews pass, and synchronizing required live ChatGPT
Project prompts or source documents from the verified repository version. It
also authorizes read-only discovery and download of commute queue, v4-reference,
and session-bundle artifacts from Brad's signed-in ChatGPT Library for private
local intake. It does not authorize changing or deleting unrelated private
files. Brad has granted standing
authorization to delete the exact queue, validated v4-reference, and
session-bundle artifacts consumed by a durably completed commute run after its
PR merges, or after a complete no-change handoff when no PR was needed. This
authorization covers all matching transient copies in ChatGPT Library, the
LLM-Wiki-Car Project Library, and Downloads without another confirmation; it
does not cover chats, prompts, unrelated Project source documents, schemas,
normalized `.private/` intake, or artifacts whose completed-use evidence is
ambiguous.

Always use SafariDriver MCP for signed-in ChatGPT Library and Project work in
this workflow. If it appears unavailable, check once more; if it is still
unavailable or unhealthy, ask Brad specifically to toggle the SafariDriver MCP
off and on. Do not substitute integrated browser, computer-use, or ChatGPT Work
tooling for this authenticated path. User sign-in and a platform-enforced
user-only control remain genuine blockers, not authorization prompts.

For every daily commute intake:

1. Validate each queue and bundle, compare every embedded snapshot with the
   separately supplied canonical queue, and use shared chats only as bounded
   recovery evidence. Capture the complete shared-chat conversation by reading
   its serialized message sequence or traversing every prompt; a single rendered
   DOM snapshot may be virtualized and omit early turns. Never invent missing
   item identity or user intent.
2. Reconcile the day into the correct evidence channels: wiki-maintenance
   candidates, exact classifier feedback, product/quality incidents, general
   captures, duplicate/prior-awareness signals, and unresolved evidence.
   Adjudicate bundle item actions against the full conversation before storing
   classifier labels. A negative assessment of an article alone does not
   establish an interest or depth correction, even when the bundle marks it
   `mark_uninterested`.
3. Preserve the private normalized intake under `.private/`, then add the
   sanitized durable findings to the experiment log or other appropriate
   tracked memory. When adding or changing a dated experiment-log result, update
   the `Evidence Sources` inventory in the same diff and cross-check its queue,
   bundle, and shared-chat counts against the result. Do not silently turn an
   interesting discussion into a wiki save or classifier label.
4. Route every material recurring finding to its existing open GitHub issue
   when one fits. Add an evidence-backed comment with the exact date, artifact
   identity, observed behavior, boundary, and resulting PR. Avoid duplicating
   an equivalent comment already on the issue. If no issue fits, keep the
   finding visible in the PR and call out the missing issue explicitly. Do not
   turn substantial workflow refactors, historical cleanup, or unrelated
   product work into same-run implementation scope.
5. Treat friction in the processing run itself as workflow evidence. When the
   same omission or mistake could recur, add the smallest durable instruction,
   test, or automation guard that makes the next daily pass simpler and safer.
6. Compare the diff with the live Project instructions and source list in
   `chatgpt-project/README.md`. If a live prompt or Project source changed, say
   exactly which Project prompt or document needs to be updated. Without waiting
   for Brad to ask, provide the exact prompt in one copyable block or name every
   exact source file and destination. Keep the update open until the agent
   applies and verifies it, then update the tracked live-version record. Do not
   make Brad infer, remember, or manually confirm an external deployment step
   from a repository diff or PR.
7. Run the relevant local validation, commit the tracked daily evidence, push
   the branch, and open a PR against the intended base. Use draft status only
   for a genuine unfinished item, not as a routine review delay. A local-only
   commit is not a completed daily commute handoff. Wait for the initial PR
   checks and report their state.
8. Cross-link the PR and issue comments, then finish with the remote branch,
   commit, PR URL, validation result, issue updates, and any genuinely
   unresolved evidence or next action. Never call the loop complete while the
   Project's prompt or documents still need to be updated. Keep the needed
   update visible before merge, but do not change the PR's draft/ready state
   because of it; ready for review is compatible with a pending Project update.
9. After the gated merge, pull `main`, verify the repository, complete any
   already-authorized exact artifact cleanup, and issue the final handoff
   without asking Brad to repeat authorization already recorded here. Report
   any mandatory environment safety confirmation precisely. If a browser UI
   presents action-time confirmation for an exact target covered by the standing
   authorization, confirm it and proceed. Stop only for a platform-enforced
   user-only control or an ambiguous target, and do not request another
   authorization for the same exact deletion batch.

If the day produces no justified tracked change, report an explicit no-change
result with the validation and issue-routing evidence; do not manufacture a PR
or public wiki content merely to make the loop look active.

The #85 model/effort experiment ended after the September 15 Sol Medium run.
Use Sol Light/Low for routine daily commutes. Escalate only when the evidence
or task complexity warrants it. Do not collect new experimental phase profiles
or delay a daily handoff for experiment bookkeeping unless Brad explicitly
reopens the experiment. Preserve existing private measurements.

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
  recurring commute workflow supplies that authorization for its qualifying PR
  and required live Project synchronization; otherwise, a request to create a
  PR authorizes only a branch, commit, push, and review-ready PR unless a genuine
  unfinished item requires draft status.
- Apply the commute publication risk tiers above before requesting or waiting
  for general-purpose AI review. When a review is required, wait for the latest
  head's review workflow to complete, inspect submitted reviews and unresolved
  threads, and address actionable findings in that PR or a clearly linked
  follow-up before publishing.
- After opening or updating a PR, wait for required checks and apply the commute
  risk tiers above. Inspect unresolved review threads. A documentation-only or
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
