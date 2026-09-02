---
name: process-daily-commute
description: Process Brad's recurring daily commute intake end to end. Use when Brad supplies or asks Codex to retrieve dated TLDR commute queues, commute session bundles, shared-chat URLs, or uses shorthand such as "today's commute," and expects validation, bounded reconciliation, durable project memory, open-issue updates, workflow improvements, publication, PR review, and a complete handoff.
---

# Process Daily Commute

Treat the commute as a recurring evidence and improvement loop, not a one-off
file review. Read the `Recurring daily commute processing` section of
`AGENTS.md` first; it is the authoritative policy. Use this skill for execution
order and completion checks.

## Five-phase performance profile (#119)

For the next 3–5 representative #85 runs, capture the actual task invocation
time before any action and start `acquisition` then. Use existing task/tool
timestamps and elapsed results, without asking Brad for checkpoints. Maintain
one private draft with `schema_version: "commute-phase-profile.v1"`, the same
`run_id` as the performance record, actual `model`, canonical `reasoning_effort`
(Light is `low`), and a `phases` array. Start/finish these five phases:

| Phase                      | Work included                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `acquisition`              | Library queues/bundles, shared chats, downloads, initial hashing                                                       |
| `evidence_processing`      | Decode, normalize, validate, compare queues, audit coverage, reconcile, decide classifier evidence and durable actions |
| `repository_work`          | Source research, wiki/log synthesis, tracked edits, local review                                                       |
| `verification_publication` | Tests, lint, format, site, OpenSpec, diff checks, commit/push/PR, issue routing, CI, review/rework                     |
| `cleanup_finalization`     | Pull merged main, cleanup/verification, performance finalization preparation and handoff preparation                   |

For each phase record `phase`, RFC3339 `started_at`/`completed_at`, numeric
`active_seconds`, `tool_execution_seconds`, `tool_call_count`, `retry_seconds`,
`work_units`, and `note` (normally null). Use first/last activity timestamps if
a phase is revisited; assign each active interval and tool call to exactly one
phase. Use the same strict agent-active intervals as the run-level record.
Pause accounting for human/merge authorization waiting and inactive gaps;
never use the entire phase envelope as active time. Tool time is non-overlapping
wall time: parallel calls count once, including groups spanning phase changes.
The recorder accepts aggregates, not raw tool spans. Retry time is only failed,
repeated, or avoidable tool work and cannot exceed tool time. Do not estimate
from tokens or call the active-minus-tool residual “LLM inference time.”

Set `work_units` to the finalized workload's independently processed bundle/
session count for every active phase, even when discovered later. Require all
five phases, including no-change runs; a skipped phase has zero measurements
and a short reason. Notes (at most 160 characters) describe only unusual work
that affects comparison. Store no prompts, chats, commands/output, URLs,
secrets, or personal content in this profile.

After terminal cleanup and preparing the handoff, use one common measurement
cutoff for phase totals and the run-level `terminal_completed_at`. As with the
existing immutable finalizer, the final writes and delivery after that cutoff
are outside the measured snapshot; do not invent their elapsed time. Finalize
the run exactly once per `docs/commute-performance-experiment.md`, then record:

```sh
node dist/src/commute/phase-profile.js record \
  .private/commute-performance/<run_id>-phase-input.json \
  .private/commute-performance/<run_id>.json
```

This validates and exclusively creates `<run_id>-phase-profile.json` in that
same private directory and prints the per-phase comparison table with totals.
Report the table with the final handoff. Active/tool totals must each reconcile
within two seconds of rounding; call counts must match exactly. Investigate
mismatches from timing evidence rather than adjusting totals to make them pass.
Use `summary` instead of `record` with the saved profile to print it again.
An interrupted/unmerged run keeps its draft; never fabricate completed phases.

After 3–5 runs, update #85 with median/P90 active time, median tool/residual
shares, cumulative retry waste, seconds/bundle, phases ranked by total time and
variance, one optimization with expected seconds saved, and the updated
workload-adjusted Light-versus-Medium estimate. Retain the seven-run descriptive
baseline `active_seconds ≈ 540 + 219 × bundles − 257 × Light` (R² 0.993,
residual standard error about 48 seconds). Historical phase times remain
unknown; never allocate historical aggregate time across these phases.

## Publication scope and communication

Follow the risk-tiered publication policy in `AGENTS.md`. Content- and
evidence-only daily publication relies on deterministic gates and explicit
merge authorization; it does not require a general-purpose AI review unless a
gate or maintainer identifies ambiguity. Routine generated state updates need
at most one required latest-head review. Code, schema, routing, prompt, or
workflow behavior changes need one latest-head review after local checks.

Batch findings from one review round into one fix commit. Request another full
review only when a fix materially changes behavior or invalidates the prior
review. Keep the daily PR to the day's evidence and the smallest directly
necessary guard; route larger workflow refactors, historical cleanup, and
unrelated product work to linked follow-up issues.

Use only these routine progress updates: intake validated (including a genuine
evidence problem), PR ready (including checks and any action Brad must take),
and merged and finished or concretely blocked. Do not ask for acknowledgment,
narrate routine tool calls, or repeat unchanged polling state.

## Retrieve Library intake

When Brad names a commute date or says "today's commute," treat missing file
attachments as a retrieval task, not a reason to ask him to download and attach
the artifacts. Use the signed-in ChatGPT web Library before requesting files:

1. Resolve relative dates in `America/New_York` and form `YYYYMMDD`.
2. Open the `LLM-Wiki-Car` folder in ChatGPT Library. Bound discovery from the
   last successfully recorded commute intake through the requested time, then
   inventory both canonical files matching
   `YYYYMMDDHHmm-(morning|evening)-commute-session-bundle.txt` and plausible
   bundle rows whose displayed name is missing, noncanonical, contradictory, or
   Library-suffixed. Use the displayed Modified value, nearby dated rows, and
   inspection-only preview to discover plausible exports; do not treat any
   filename as semantic session identity before validation. Record every
   displayed filename exactly, including a Library duplicate suffix such as
   ` (1)`.
3. Retrieve every matching bundle with the Library row's original `Download`
   action. Do not use copied or scraped preview text as the artifact: the
   rendered preview can remove JSON escape characters while the original file
   remains valid. Use previews only to inspect or identify a row. Do not select
   only the newest morning or evening file: multiple same-period bundles may
   represent different queues or sessions. Preserve identical downloads as
   duplicate provenance; preserve non-identical files for independent
   validation.
4. Read each bundle's `queue_snapshot.filename`, then retrieve that exact
   canonical queue from the main ChatGPT Library. Deduplicate repeated queue
   names after retrieval. Do not infer the queue from the bundle's period,
   timestamp, topic, or nearby filenames. When a malformed bundle cannot expose
   its declared queue name, search the main Library's bounded intake inventory
   and any source dates established by bounded session evidence. Inventory the
   exact dated candidates (`YYYYMMDD-tldr.txt`, `YYYYMMDD-tldr-dev.txt`,
   `YYYYMMDD-tldr-ai.txt`, and `YYYYMMDD-tldr-fintech.txt`) for every relevant
   source date; do not limit fallback discovery to the requested or export date.
   Keep the mapping unresolved until validation or bounded conversation evidence
   establishes it.
5. Retrieve each exact queue with its Library row's original `Download` action
   as well; the same preview-text restriction applies.
6. Store the retrieved artifacts with the normalized private intake under
   `.private/`, recording Library location, displayed filename, displayed
   Modified value, and local path. Treat browser downloads as untrusted inputs
   and validate them before using their contents as evidence.

If Library access or an exact file retrieval fails, report the exact missing
artifact and the attempted location. Ask Brad to attach only those unresolved
files; do not make him reattach artifacts already retrieved successfully.

## Intake and reconcile

1. Inventory every retrieved or supplied queue, bundle, and shared-chat URL.
   Deduplicate repeated URLs without dropping distinct files or sessions.
2. Read the active commute prompt, bundle schema and validator, relevant
   OpenSpec change, and the recent experiment-log entries before interpreting
   new evidence.
3. Validate each canonical queue and each bundle independently. Compare the
   embedded queue snapshot byte-for-semantic-field with the separately
   retrieved or supplied queue. Use shared chats only as bounded recovery
   evidence.
4. Preserve normalized private intake under `.private/`; never commit it. Do not
   invent item identity, user intent, intermediate playback, wiki saves, or
   classifier labels.
5. Reconcile evidence into the repository's established channels: maintenance
   candidates, exact classifier feedback, quality incidents, general captures,
   duplicate/prior-awareness evidence, and unresolved evidence.
6. Build a private conversation-coverage ledger before editing durable outputs.
   Give every substantive user comment, correction, discussion point, save
   request, workflow complaint, and export/recovery observation a disposition:
   exact wiki content, wiki synthesis/annotation, classifier feedback, quality
   incident, existing issue update, new issue, unresolved evidence, or no
   durable action with a recorded reason. Playback commands and social filler
   may share one explicitly excluded category; never silently omit a substantive
   turn.

Brad's words are natural-language intent, not a command grammar. Standardized
enum values and schema terms are internal artifact vocabulary only. Interpret
clear synonyms, paraphrases, positions such as “N of M,” and unambiguous item
references against the verified active queue. Ask a short neutral clarification
only when the intended action or target genuinely cannot be determined.

## Curate durable learning

1. For each explicit wiki save, incorporate the useful discussion surrounding
   the item, not only the linked source. Ground source claims in retrieved
   evidence and label commute-derived comparisons, implications, hypotheses,
   and preferences as synthesis or discussion context. Cross-check the finished
   wiki diff against the conversation-coverage ledger.
2. Add sanitized, evidence-backed findings to the experiment log or other
   canonical tracked memory. Preserve classifier and workflow annotations even
   when the malformed bundle omitted them but the canonical queue and bounded
   conversation evidence establish them exactly.
3. Search all open issues before creating a new destination. Route every
   material commute-flow observation to every relevant existing issue in the
   same run rather than choosing only one umbrella issue. Include date, artifact
   identities, observed behavior, boundary, and PR link; avoid duplicate
   comments. Keep a private feedback-to-issue matrix with the resulting issue
   and comment URLs.
4. Treat mistakes and friction in this processing run as evidence. Add the
   smallest durable prompt, instruction, specification, schema, test, or
   automation change that prevents recurrence.
5. Distinguish observed product defects from normal user behavior and from
   contract gaps. Correct stale or inaccurate issue/PR comments instead of
   allowing contradictory durable memory to remain.
6. Before publication, perform a reverse audit from both matrices: every
   substantive conversation entry must reach its intended durable destination,
   and every wiki or issue claim must trace back to exact evidence. Resolve any
   gap in the same run or report it as genuinely unresolved.

## Verify and publish

1. Before treating repository edits as the whole deliverable, compare the diff
   with the live Project instructions and source list in
   `chatgpt-project/README.md`. Any changed live prompt or Project source creates
   a required ChatGPT Project prompt replacement or named source-document
   upload; never leave Brad to infer it from the diff.
2. When that ChatGPT Project update is required, immediately provide the exact
   merged or review-ready prompt in one copyable block, or list every exact
   source file and its Project destination. Say exactly which Project prompt or
   document needs to be updated. Do this without waiting for Brad to request it.
   Repository and GitHub writes do not authorize changing the live Project UI,
   so keep the required prompt replacement or source-document upload explicitly
   unresolved until Brad confirms it was applied. Then update the repository's
   live-version record in the active PR or a focused follow-up.
3. Run focused tests while iterating, then run `npm run check`, strict validation
   for every touched OpenSpec change, and `git diff --check`. The repository's
   Node validation gate checks tracked skill frontmatter and structure as part
   of `npm run check`; do not invoke the system Python `quick_validate.py`.
4. Commit only the intended tracked files, push the branch to `origin`, and open
   or update the PR required by the repository's `AGENTS.md`. Use draft status
   only for a genuine unfinished item. Never stop at a local commit; use the PR
   body or checklist for unfinished review, CI, or a concrete Project prompt
   replacement or source-document upload without delaying a review-ready PR.
5. Keep the PR body current with user impact, root cause, evidence counts,
   validation, and the latest head commit. Cross-link relevant issues.
6. Inspect all required review threads. Fix actionable comments, reply with the
   commit and validation evidence, resolve the thread, and request a fresh
   review only when the fix materially changes behavior.
7. Wait for the latest-head CI checks and the review workflows required by the
   applicable risk tier. Merge only with explicit user authorization and only
   when checks and actionable review threads are clean.

## Post-merge artifact cleanup

Cleanup of transient source artifacts is destructive. `AGENTS.md` records
Brad's standing authorization for the exact queue and session-bundle artifacts
consumed by durably completed commute runs; this skill text alone is not
authorization. Record the applicable standing or current-request authorization
in the private retrieval manifest. Cleanup may begin only after processing is
durably complete:

After an authorized merge, pull `main` and verify the repository before cleanup.
Complete already-authorized exact cleanup and the final handoff without asking
Brad to repeat authorization already recorded in `AGENTS.md`; report any
mandatory environment safety confirmation precisely.

1. If the run has a PR, do not delete anything until that exact PR is merged.
   An open, draft, closed-unmerged, or checks-pending PR leaves cleanup pending.
   If the run has a justified no-change result and no PR, cleanup may begin only
   after the complete no-change handoff is recorded.
2. Resolve cleanup targets from the private retrieval manifest and inventory
   each Library location independently. In the main ChatGPT Library, delete
   only the exact queue rows consumed by the completed run. In the
   `LLM-Wiki-Car` Project Library folder, separately delete only the exact
   commute-session bundle rows consumed by that run. A successful deletion in
   one location does not establish deletion of its matching copy in the other.
   Do not delete the Project Library folder itself, shared chats, Project source
   documents, schemas, prompts, unrelated dated artifacts, or a plausible row
   that was not validated into the final intake.
3. In `~/Downloads`, remove only the exact queue and bundle downloads created
   or verified during this run. Match filenames and, when duplicate suffixes or
   pre-existing same-name files exist, confirm content against the private
   intake before removing them. Prefer moving local files to Trash; never use a
   broad glob or recursive deletion.
4. Keep the normalized `.private/` intake, coverage ledger, and retrieval
   manifest as the durable audit and recovery record. Library and Downloads are
   transient copies; `.private/` is not part of this cleanup request.
5. Reopen and inventory both Library locations after deletion. Verify that
   every targeted queue row is absent from the main ChatGPT Library, every
   targeted bundle row is absent from the `LLM-Wiki-Car` Project Library
   folder, and every targeted Downloads file is absent. Then append the exact
   targets, deletion time, and per-location verification result to the private
   retrieval manifest. Report partial failures precisely and leave unmatched
   or ambiguous files untouched.

When cleaning historical residue, build the allowlist from merged repository
history plus preserved private intake. A matching date or artifact-shaped name
alone is insufficient: require durable evidence that the exact queue or bundle
was validated and consumed into a completed commute result. Apply the same
preservation, exact-match, verification, and audit rules as the current run.

Keep the original task and worktree responsible for post-merge cleanup because
its gitignored private manifest does not follow a new isolated worktree. If
Codex is not active when the PR later merges, report cleanup as pending and ask
Brad to resume that task. If the original context is unavailable, do not delete
from a guessed target list: re-inventory the Library and Downloads, re-establish
exact filenames and content matches, and obtain any deletion authorization not
already recorded before removing anything.

## Completion

Report the remote branch, commit, PR, CI/review state, issue updates, evidence
counts, Library retrieval results, and any genuinely unresolved item. Explicitly
report conversation coverage: substantive entries audited, wiki saves reflected
with discussion context, classifier/quality annotations retained, workflow
observations routed, issue comment URLs, and any excluded entries with reasons. Do not call the daily
loop complete while a required ChatGPT Project prompt replacement or named
source-document upload is unconfirmed. Keep that concrete update visible as a
pre-merge checklist item, but do not change the PR's draft/ready
state because of it; ready for review is compatible with pending confirmation
of that concrete update. For every changed live prompt, return the exact file
contents in one copyable block before handoff; never reconstruct them from
memory and never make Brad remember to ask.
When a PR exists, make its clickable URL the final content in every completion
handoff. Render it as a level-one Markdown heading with a bold linked label so it
is large and cannot be buried; place no text, list item, or footer after it.
