# Classifier v2 implementation runbook

Status: ready for review as a plan. The implementation described below does not
yet exist. This runbook is for Sol to execute and Brad to review without needing
to reconstruct the planning conversation.

Build the five improvements in [R1–R5](requirements.md#part-1--new-improvements).
Keep daily generation in the existing ChatGPT Project and weekday task. Prepare
five small, stacked implementation PRs before Brad’s review window; perform one
combined historical simulation before release. Code review increments do not
require five deployments or five full commute tests.

## Timing and responsibilities

| Phase                   | Target                                                    | Sol’s responsibility                                                                                                        | Brad’s responsibility                                                               | Completion                                                                      |
| ----------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0 — Prepare             | First implementation block on Sunday, September 6         | Inspect current files; recover available historical inputs; prepare blind labels and baseline; reserve final-check material | Supply missing labels when available                                                | Inputs and examples ready; coding can continue without answers                  |
| 1–5 — Build             | Sunday’s uninterrupted implementation block               | Prepare all five PRs, tests, examples and installation list; finish independent work before waiting                         | No action needed while busy                                                         | Reviewable stack; scoring results clearly marked pending if answers are missing |
| 6 — Review and simulate | Sunday afternoon, continuing Monday if needed             | Address review changes, check combined files and assist the simulated commute                                               | Review/tweak/approve PRs, finish labels, replace candidate Project files and listen | Brad accepts the combined experience as no worse than today                     |
| 7 — Generate and use    | Monday, September 7; first listen Tuesday AM, September 8 | Verify Monday output, use established phone recovery if the write fails, finish handoff                                     | Confirm Project updates and any final fixes; listen Tuesday                         | Monday files present in the Project Library and ready for Tuesday               |

These are targets, not measured coding estimates. If a blocker threatens the
review window, report the unfinished PR and actual remaining work. Continue the
other PRs. Do not wait for PR 1 to merge before coding PRs 2–5. The only required
waits are for unavailable source access, Brad’s answers where results depend on
them, and approval for merges/live installation.

## Current system and implementation choices

**Current:** queue v3, Voice Prompt 4.2, profile 1.4, classifier instructions v1,
routing rules v1 and session bundle v1. `chatgpt-project/README.md` records the
installed Project sources. Confirm that record against available live evidence;
do not claim a new file is installed merely because it is committed.

**This release:** queue v4 uses a playback/reference pair; Voice Prompt 5.0 reads
it; the candidate classifier instructions are v2 and the calibrated profile is
2.0. Routing thresholds remain unchanged. Keep session bundle v1’s outer fields
and accept a v4 snapshot as described below. Retain old v2/v3 readers and files.
These are planned version labels, not claims about the current Project.

The production sequence is:

```text
11 a.m. weekday ChatGPT task in LLM-Wiki-Car
  -> retrieve all qualifying newsletters for the delivery date
  -> extract editorial articles and resolve original URLs
  -> group identical URLs and fill missing attribution from article pages
  -> classify each distinct article using title, description and attribution
  -> identify repeated stories and useful updates across different URLs
  -> choose retained source text and prepare headline context
  -> render and check both files per newsletter using the Project’s tools
  -> create actual downloads directly in the Project Library
```

A new phone chat in the same Project can repeat this process or finish a failed
write. Nothing in this daily path requires the Mac. Local commands below check
files or support Brad’s scoring round; they do not become a second producer.

### Pair and export representation to implement in PR 1

The main JSON has only `sweep_playback` and `items[].item_playback`, exactly as
[R1](requirements.md#r1--produce-separate-playback-and-reference-files) specifies.
Use the usual filenames: `YYYYMMDD-tldr.txt`, `-tldr-dev.txt`, `-tldr-ai.txt`,
`-tldr-fintech.txt`, each with its sibling `-reference.txt`.

The reference schema records `queue_version: tldr-commute-queue.v4`,
`main_filename`, `main_sha256` (the canonical-JSON hash specified in R1), newsletter, edition date, source email identity,
total items and the existing producer/profile/routing versions. Each reference
item retains the existing item metadata and adds its matching array position,
attribution status and source records needed by PRs 2–3. Keep the literal
original descriptions; headline excerpts do not replace them. PR 1 defines the
exact fields in JSON Schema and TypeScript; PRs 2–3 add their narrowly scoped
fields in their own diffs. Do not copy playback strings into default Voice
instructions or require loading reference metadata to start.

For a v4 session, keep the existing `queue_snapshot.filename` as the main
filename. Its `queue` value is a versioned wrapper:

```json
{
  "queue_version": "tldr-commute-queue.v4",
  "playback_file": {
    "sweep_playback": "",
    "items": []
  },
  "reference_file": {}
}
```

This illustrates the wrapper only; `reference_file` must contain the complete
valid reference, not an empty object. Export includes both full objects. Resolve
saved item identities from their recorded positions and the matching reference
at export time, without requiring a reference read at session start. Reject
unsupported or mismatched identities rather than reconstructing from topic memory.

Extend queue/snapshot validation and the narrow item-access helpers used by
import and recovery to read this wrapper. Do not change the event model or
redesign session retry behavior. An exported wrapper is a self-contained copy;
the two generated input files remain separate in the Project Library.

## Exact files changed and when

Paths below are repository-relative. “New” files are implementation targets,
not files already delivered by this planning PR. Every PR must replace this list
with its actual changed-file list in its description if implementation finds a
necessary additional file.

| PR              | Project files and schemas                                                                                                                                                                                                                                                                                                                    | Repository code and tests                                                                                                                                                                                                                                                                                                                                                                                          | When it affects daily use                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1 — Pair        | New `chatgpt-project/queue-generation-v4.md`, `chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md`, `schema/tldr-commute-playback-v4.schema.json`, `schema/tldr-commute-reference-v4.schema.json`; edit `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`, `chatgpt-project/session-export.md`, `schema/commute-session-bundle-v1.schema.json` | Edit `src/commute/session-bundle.ts`, `src/commute/validate-queue.ts`, `src/commute/validate-session-bundle.ts` and affected access points in `recover-session-bundle.ts`, `import-session-bundles.ts`, `run.ts` and `src/classifier/feedback-label.ts`; new `tests/queue-pair.test.ts`; extend `tests/session-bundle.test.ts`, `tests/import-session-bundles.test.ts`, `tests/project-prompt.test.ts` as affected | After combined candidate installation in Phase 6                           |
| 2 — Attribution | Edit v4 generation instructions and reference schema; edit `schema/classifier-instructions.md` to accept verified author/publication metadata                                                                                                                                                                                                | Extend matching input types in `src/classifier/types.ts` only where needed; reference validation in `src/commute/session-bundle.ts`; attribution cases in pair/prompt/classifier tests                                                                                                                                                                                                                             | Same installation; lookup runs in the Project before classification        |
| 3 — Duplicates  | Edit v4 generation/task instructions and reference schema for source occurrences, retained-item links and update notes                                                                                                                                                                                                                       | Pair validation checks source links, order and totals; add duplicate examples to `tests/queue-pair.test.ts` and Project instruction checks                                                                                                                                                                                                                                                                         | Same installation; compare all editions before rendering                   |
| 4 — Context     | Edit v4 generation instructions, playback/reference validation rules and Voice instructions only as needed to accept the prepared text                                                                                                                                                                                                       | Extend pair and prompt tests for literal excerpts and generated update prefixes; keep old v3 templates unchanged                                                                                                                                                                                                                                                                                                   | Same installation; only unclear headline-only items get extra default text |
| 5 — Calibration | Edit `schema/interest-profile.md`, `schema/classifier-instructions.md`; update candidate version labels in v4 instructions                                                                                                                                                                                                                   | New `scripts/classifier-v2-review.mjs`, focused `tests/classifier-v2-review.test.ts`; change `src/classifier/feedback-label.ts` only if necessary to read verified labels without discarding unknown historical metadata                                                                                                                                                                                           | Candidate profile installed after Brad’s review and final comparison       |

All five PRs maintain `chatgpt-project/README.md`’s candidate installation list;
keep its live-status statements unchanged until deployment is confirmed. PR 5
adds a concise report under `docs/classifier-v2/validation-results.md` only after
results exist. Keep private inputs and per-article results outside Git.

OpenSpec records the chosen behavior, not another approval process. Update the
relevant existing files within the PR that changes the behavior:

- PR 1: bootstrap `specs/commute-queue/spec.md`; operating-loop
  `specs/queue-selection/spec.md`, `specs/session-bundle/spec.md`,
  `specs/voice-session/spec.md`, `specs/commute-import/spec.md` and
  `specs/scheduled-queue-output/spec.md`; the affected design/task statements;
  and pre-render-queue-playback-text’s queue/Voice clauses where they mandate v3.
- PRs 2–4: only the attribution, duplicate and literal-playback clauses changed
  by those PRs, including their matching examples.
- PR 5: bootstrap `specs/classifier-routing/spec.md` and
  `specs/feedback-labels/spec.md`; replace the obsolete date-based holdout clause
  with explicit development/final-check assignments. Update affected task text.

These paths are under `openspec/changes/bootstrap-llm-wiki-mvp/`,
`openspec/changes/commute-wiki-operating-loop/` and
`openspec/changes/pre-render-queue-playback-text/`. Preserve unchanged behavior;
no separate specification-only PR or external research phase is required.

## Phase 0 — Prepare data and examples without delaying coding

### Sol’s tasks

1. Read `AGENTS.md`, these requirements, the live-source list, current generation
   and task prompts, and the affected schemas/readers. Check branch and worktree
   state before editing. Use an isolated implementation worktree.
2. Collect recoverable newsletters from two or three days in the preceding week,
   covering all four editions when available. Confirm actual dates and sources;
   keep only private article extracts, not raw email bodies. Use already collected
   inputs where possible. If those dates are unavailable, use other available
   dates and explain the substitution. No July 28 dependency exists.
3. Prepare full article inventories, existing outputs and recorded corrections.
   Include omitted articles. Do not relabel routing-version mismatches as scoring
   mistakes; retain Brad’s explicit corrected labels independently.
4. Save the current Project sources and actual version identifiers as the baseline.
   Reuse original queues where available. Where predictions are missing, request
   a baseline scoring run using the current instructions in the existing Project
   and save its results privately. Use a dedicated text chat with the exact
   baseline/candidate profile, instructions and private article inputs selected
   explicitly for that run. Save predictions as review data, not live commute
   filenames. This does not replace the installed Project sources. Do not create
   a local model adapter.
5. Assemble a development batch using existing verified labels plus up to **20
   new articles** needing Brad’s answers. Reserve a separate **20-article final
   check** across dates/editions where possible before tuning. These are starting
   batch sizes, not claims of statistical certainty or compulsory additional work.
6. Keep related articles together and out of both sides of the split. If no unused
   historical material remains, reserve Monday’s incoming articles for the final
   check before using their labels. The current profile stays available until the
   candidate passes review; Tuesday is the first listen to Monday’s material.
7. Give Brad the blind review when ready, then continue all independent coding.
   Answers and predictions must not be embedded in the same labeling page, even
   in hidden fields. Do not inspect final answers while tuning.

### Output / Brad’s step

A private input folder, the baseline files, a short inventory of dates/editions
and a blind labeling batch. Brad supplies interest/depth answers when free; the
implementation stack does not stop while waiting. Reuse labels instead of asking
him to repeat them. A missing depth answer stays missing.

## Phase 1 / PR 1 — Playback/reference pair

### Build

1. Add the two schemas and v4 generation/task documents. Preserve weekday 11 a.m.
   execution and the same-Project manual request. Include executable rendering
   and preflight snippets in the generation document for the Project’s code tool,
   covering canonical hashing, counts and pair checks; prose alone is insufficient.
   Update Voice to load the main
   file only and return to it after requested details.
2. Implement pair checking in the existing validator, with a new optional
   `--reference /path/to/reference.txt` argument. Existing single-file invocations
   for v2/v3 keep working. A standalone v4 playback file requires its reference
   for full validation. The Project’s own preflight checks the same conditions
   using its code tools; the Mac checker is for development/intake only.
3. Implement the v4 snapshot wrapper and narrow reader changes. Extend existing
   `--queue` bundle validation with a matching `--reference` option. Ensure
   import, recovery, feedback and wiki-source extraction still find exact items.
4. Define empty-queue behavior, pair hashes and explicit revision filenames in
   generation instructions. Never overwrite an input already used by a session.

### PR result and checks

Show one invented pair and its exported bundle. Check missing/swapped/reordered
references, extra main-file fields, empty queues and correct save/correction
identities. Run existing v2/v3 cases as well as new v4 tests. Use populated
invented attribution in these examples; PR 2 completes real attribution lookup
before installing the combined candidate.

Brad reviews the file shape and examples. Actual phone validation is part of
Phase 6; a successful text test does not establish what Voice says.

## Phase 2 / PR 2 — Attribution before classification

### Build

1. Add the R2 lookup instructions to the Project generation document: use available
   newsletter attribution, otherwise read the resolved article URL using the
   generation LLM’s tools. Reuse the result across copies of that URL.
2. Require nonempty author/publication strings and explicit source/status metadata.
   Distinguish `No authors listed` from `Author lookup failed`; use a hostname
   fallback for publication. Retry an access failure once, then continue other
   articles. Never call a failed lookup evidence of an absent byline.
3. Extend classifier inputs to accept verified attribution and ignore failure/status
   strings as preference signals. Keep model output source-neutral. The reference
   stores the result; no extra attribution is spoken by default.

### PR result and checks

Show the five attribution cases in R2, the URLs consulted and expected reference
fields. Test validation and input handling locally; actually exercise the lookup
on historical sources in the Project during Phase 6. Brad checks a few resulting
bylines and sites. This PR needs no separate model integration or phone deployment.

## Phase 3 / PR 3 — Daily repeated coverage and updates

### Build

1. Make one Project generation pass collect all editions before rendering.
   Resolve URLs; remove tracking parameters conservatively; classify each exact
   article once with attribution already available.
2. Add the same-story comparison after classification. Remove redundant coverage,
   preserve useful new information as an update, and retain uncertain matches.
   Choose the useful source description rather than always the first occurrence.
3. Store source occurrences, retained-item references, decision reasons and update
   notes in the reference files. Rebuild positions and sweeps. For a fully removed
   edition, its empty reference still identifies where its articles were retained.
4. Produce a private review table for the historical run: each removed occurrence,
   the retained file/item, reason and any new information kept. This can be a
   simple table from the generation run; do not build a new reporting framework.

### PR result and checks

Provide exact-URL, different-URL same-story, meaningful-update, unrelated-story,
empty-edition and no-duplicate examples. Automated checks establish correct file
links and counts; Brad inspects the semantic decisions across the historical days.
Listening alone cannot validate removed content. Correct questionable removals
before the combined release.

## Phase 4 / PR 4 — Context for unclear headlines

### Build

1. Add R4’s selection and excerpt instructions to v4 generation. Keep clear
   headlines short and preserve the full original description in the reference.
2. Check that the selected excerpt is literal source text. Record its source
   occurrence when duplicate removal chooses a different newsletter’s wording.
   Generate any update prefix separately; do not claim that prefix is quoted text.
3. Keep the sweep free of descriptions and keep depth labels unchanged. Extend the
   v4 checker/template without loosening the old v3 literal checks.

### PR result and checks

Show before/after playback for a small mix of clear titles, unfamiliar names and
clickbait. Include an already-in-depth item as an unchanged comparison. Brad
reviews the examples and judges the extra reading during Phase 6. Adjust from
that feedback; do not schedule another large test just for this change.

## Phase 5 / PR 5 — Calibrate and compare

### Build while Brad is busy

1. Prepare candidate profile 2.0 and classifier instructions v2 using verified
   historical corrections and explicit preferences. Keep current score thresholds.
   Preserve the input additions from PR 2.
2. Add the small review script named in the file table. It consumes saved private
   article/label/prediction files, produces a standalone HTML labeling page with
   no prediction data and a local JSON answer export, and reports baseline/candidate
   comparisons. Document its commands and file examples in the PR. It makes
   no model calls and performs no production generation. Use a simple documented
   private JSON layout, not a family of new persisted formats.
3. Test that labels are not exposed to the predictor, predictions are not exposed
   to Brad’s labeling view, duplicate article copies do not inflate counts, and
   missing labels are not treated as correct answers.
4. Prepare this PR’s code and profile diff before earlier PRs merge. Mark the
   experiment results pending rather than claiming success or blocking other PRs.

### Finish when answers arrive

1. Use development answers to correct the profile/instructions. Request a candidate
   rerun in the Project and save the predictions, exact source files and versions.
2. Fix the candidate before evaluating the reserved batch. Run baseline and candidate
   on identical final inputs in separate fresh generation chats without answer
   files or tuning discussions. Brad labels without seeing predictions.
3. Report counts of false skips, missed depth, unwanted in-depth items and changed
   labels; show missing answers and excluded articles explicitly. Keep ordinary
   samples separate from tests selected because they previously failed.
4. Ask Brad whether the comparison is sufficient and no worse. If an important
   category is missing or a result is unclear, request a small targeted extension,
   not another full labeling exercise. If a serious miss causes a revision, use
   fresh final examples for the changed rule instead of claiming the reused test
   proves general improvement.

### PR result / completion

A reviewable profile/instruction diff, reusable lightweight review tool and actual
comparison results. No numeric improvement claim before results exist. Brad’s
acceptance completes this phase; continued feedback collection does not delay
release for a fixed number of weeks.

## Phase 6 — Review the stack and validate the combined experience

### Review and merge sequence

Use branches `agent/classifier-v2-pair`, `-attribution`, `-duplicates`, `-context`
and `-calibration`. The first implementation PR targets main after this planning
PR is approved/merged; while it is still open, the first may target this plan’s
branch. Each later PR targets the preceding branch. Sol builds through the stack
without waiting for merges. Keep each child diff limited to its own feature.

Every PR description includes: requirement IDs, parent PR, exact changed files,
one before/after example, checks run, remaining human validation and the live
files affected. After Brad approves a parent, merge it, rebase/retarget the child
onto updated main and check its diff. Address review changes through affected
children in one pass rather than restarting the work.

For each behavior PR run focused tests, then `npm run check`, `git diff --check`
and strict validation of affected OpenSpec changes. Follow the existing repository
review policy once for the complete behavior change; do not add extra review
rounds for unchanged code. Automated tests use invented data and no paid calls.

### Install the combined candidate

Merging and installation are separate steps. After approval, Sol gives Brad the
exact candidate files in the table below, with copyable prompts and absolute local
links. Brad replaces the Project sources/Instructions and Task body, then confirms.
Record the installed versions in `chatgpt-project/README.md`. Do not replace old
artifact files or unrelated Project sources.

| Destination                | Exact replacement                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Project Instructions field | Contents of `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md` for Prompt 5.0                                                     |
| Project Sources            | Replace `queue-generation-v3.md` with `queue-generation-v4.md`; replace the active queue-v3 schema with both v4 schema files |
| Project Sources            | Replace `session-export.md` and `commute-session-bundle-v1.schema.json` with the compatible versions from PR 1               |
| Project Sources            | Replace `classifier-instructions.md` and `interest-profile.md` with the accepted candidate versions                          |
| Existing weekday Task body | Contents of `chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md`; retain weekdays at 11 a.m. America/New_York              |
| Project Sources retained   | `routing-rules.md` and unrelated working sources                                                                             |

Before replacement, identify the Git commit containing each currently installed
file and note any live differences. Restoring a previous version means copying
those files back, including the Task body and Project Instructions, and confirming
installation. Use this established procedure; no additional rollback service is
needed. Old artifacts remain supported by local readers.

### Generate historical pairs and simulate

In a new chat in the same Project, use the candidate’s copyable manual request to
process the two or three selected historical dates. It must retrieve the actual
newsletters, run all five changes and create real matching files. Preserve the
baseline locally; if the historical filename already exists, use an explicit
`-v2-trial` suffix before `.txt` and its matching `-reference` sibling rather than
silently replacing it. Ensure Voice selects the trial main file explicitly.

Sol checks every generated pair and the complete article inventory, then shows
Brad attribution examples, omissions and duplicate removals. With the implemented
CLI, the pair check is:

```sh
npm run validate:commute-queue -- /absolute/path/20260904-tldr-dev-v2-trial.txt \
  --reference /absolute/path/20260904-tldr-dev-v2-trial-reference.txt
```

This `--reference` option is to be added in PR 1; it does not exist in the current
release. Corresponding bundle validation must accept the same reference alongside
its existing `--queue` argument.

Brad runs a simulated commute in the actual phone GPT Live environment. Across
short and long queues, check:

1. The complete opening sweep, then ordinary next/back/jump playback.
2. Useful context for unclear headlines and absence of repeated coverage.
3. A requested original description, author/publication and source discussion,
   followed by several ordinary advances reading the main strings again.
4. An explicit save and correction tied to the correct item.
5. A real exported bundle, including a second session that never requested details.

Sol compares the export to the pair and checks that local intake still works.
Record actual speech problems, not merely a model’s assurance or a valid file.
There is no need to prove which individual change caused the combined result.

### Release decision

Brad’s bar is that the result is no worse than the current approach and useful
enough to use. Serious new omissions, incorrect duplicate removals, unusable
playback or lost saves must be fixed before acceptance or trigger restoration of
the prior Project files. For smaller issues, agree on a concrete fix and iterate.
State remaining problems without inventing a numerical release threshold.

Record the actual dates tested, accepted commit/files, brief results, Brad’s
acceptance and any remaining fix in `validation-results.md`. Keep detailed private
answers and chats under `.private/`. Do not mark this phase complete while the
candidate is uninstalled or the required manual checks are pending.

## Phase 7 — Monday generation and Tuesday handoff

1. If the accepted candidate is installed before Monday’s 11 a.m. task, let the
   existing task generate the new newsletters. Verify actual paired downloads
   and edition coverage in the Project Library.
2. If installation finishes later, generate Monday’s newsletters in a new Project
   chat on the phone using the same v4 manual request. There is no need to wait
   for another scheduled day. If the scheduled run only failed at final writing,
   use the established manual completion request first.
3. If Monday provides the reserved final scoring material, finish the blind check
   before Tuesday listening and accept or fix the candidate. Labeling and raw
   predictions remain separate from the ordinary commute files.
4. Correct or regenerate failed pairs. Do not report a scheduled status or a link
   label as proof of usable output. Keep usable editions available independently.
5. Hand Brad a concise result: merged PRs, accepted versions, confirmed Project/Task
   updates, available Monday filenames and any unresolved issue. Tuesday morning
   is the first real listen. Restore the prior version if the candidate remains
   unusable; do not substitute a new Mac workflow.
