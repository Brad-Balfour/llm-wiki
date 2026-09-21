---
name: process-daily-commute
description: Process Brad's recurring daily commute intake end to end. Use when Brad supplies or asks Codex to retrieve dated TLDR commute queues, commute session bundles, shared-chat URLs, or uses shorthand such as "today's commute," and expects validation, bounded reconciliation, durable project memory, open-issue updates, workflow improvements, publication, PR review, and a complete handoff.
---

# Process Daily Commute

Treat the commute as a recurring evidence and improvement loop, not a one-off
file review. Read the `Recurring daily commute processing` section of
`AGENTS.md` first; it is the authoritative policy. Use this skill for execution
order and completion checks.

## Model and performance guidance

The #85 experiment ended after the September 15 Sol Medium run. Use Sol
Light/Low for routine commutes and escalate only when the work warrants it. Do
not start a new phase profile or model-comparison run unless Brad explicitly
reopens the experiment. The procedures in
`docs/commute-performance-experiment.md` are retained as historical guidance
for existing records, not as a daily requirement.

For the first representative commute after the SafariDriver procedure changes,
keep one compact private qualification ledger for #151 and #155. Record actual
model/effort, beginning and ending five-hour/weekly meter readings when
available, active time, excluded human/merge waiting, workload, Safari tool
calls, retries and retry time, and already-available rollout token counters at
these boundaries: connection/authentication; bundle inventory/download;
declared queue/reference inventory/download; validation/import; shared-chat
audit; repository work; checks/publication/issues; cleanup/reconnect; and
handoff. This is a bounded Safari workflow qualification, not a restart of the
retired #85 or #119 comparison. Do not reopen long rollout or task histories
during the constrained run solely to obtain counters.

## Publication scope and communication

Follow the risk-tiered publication policy in `AGENTS.md`. Invoking this recurring
workflow authorizes merging its qualifying PR after the required gates pass and
performing required live Project synchronization. Do not ask for separate merge,
deployment, Project-update, or cleanup permission. Content- and evidence-only
daily publication relies on deterministic gates and does not require a
general-purpose AI review unless a gate or maintainer identifies ambiguity.
Routine generated state updates need
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

Always use SafariDriver MCP for Library acquisition. If it appears unavailable,
check its availability once more. If it is still unavailable or unhealthy, stop
and ask Brad specifically to toggle the SafariDriver MCP off and on to restart
it. Before any Library action, start with `list_tabs`. Switch to the candidate
ChatGPT tab and prove authentication by
successfully opening Library or the named Project and reading a signed-in-only
control or content row; a ChatGPT URL in the tab inventory is not enough. An
ordinary Safari window is not proof that SafariDriver controls an authenticated
tab: the driver may launch a separate Safari process with isolated sign-in
state. If the controlled tab shows the login page or no authenticated ChatGPT
tab exists, say that the driver session is isolated, open ChatGPT in the
driver-created tab, and ask Brad to sign in there. Keep that Safari process open
for the whole run. If its MCP transport closes, start a new driver connection,
inspect `list_tabs`, and repeat the signed-in-only page check before proceeding.
Never promise that a new driver will attach to another Safari process or inherit
its cookies.

### SafariDriver MCP has no browser fallback

Do not silently switch to integrated browser, computer-use, or ChatGPT Work
tooling; report the exact missing condition. Normal public-source research may
still use web retrieval, local validation may use the shell, and repository work
may use Git and GitHub.

1. Resolve relative dates in `America/New_York` and form `YYYYMMDD`.
2. Open the `LLM-Wiki-Car` folder in ChatGPT Library and switch to **List
   View**. Bound discovery from the last successfully recorded commute intake
   through the requested time, then inventory both canonical files matching
   `YYYYMMDDHHmm-(morning|evening)-commute-session-bundle.txt` and plausible
   bundle rows whose displayed name is missing, noncanonical, contradictory, or
   Library-suffixed. Use the displayed Modified value, nearby dated rows, and
   inspection-only preview to discover plausible exports; do not treat any
   filename as semantic session identity before validation. Record every
   displayed filename exactly, including a Library duplicate suffix such as
   ` (1)`.
3. Before opening a preview, use each exact row's three-dot menu and choose
   **Download**. Retrieve bundles first. Direct download is the normal path
   because it preserves the supplied artifact. If the exact row cannot be
   downloaded after a bounded retry, complete DOM-rendered content may be saved
   as a recovery artifact only when it can be checked by the same schema,
   pair/hash, and canonical-snapshot validation as a download. Record the
   recovery method and reject truncated, altered, or invalid rendered content;
   do not claim that original-byte access is universally required when the DOM
   recovery validates. Do not select only the newest morning or evening file:
   multiple same-period bundles may represent different queues or sessions.
   Preserve identical downloads as duplicate provenance; preserve non-identical
   files for independent validation.
4. Read each bundle's `queue_snapshot.filename`, then retrieve that exact
   canonical queue from the main ChatGPT Library. For queue v4, also retrieve
   the matching `-reference.txt` row and validate the playback/reference pair.
   Deduplicate repeated queue/reference names after retrieval. Do not infer the
   queue from the bundle's period, timestamp, topic, or nearby filenames. When
   a malformed bundle cannot expose its declared queue name, search the main
   Library's bounded intake inventory and any source dates established by
   bounded session evidence. Inventory the exact dated candidates
   (`YYYYMMDD-tldr.txt`, `YYYYMMDD-tldr-dev.txt`, `YYYYMMDD-tldr-ai.txt`, and
   `YYYYMMDD-tldr-fintech.txt`) and their v4 reference siblings for every
   relevant source date; do not limit fallback discovery to the requested or
   export date. Keep the mapping unresolved until validation or bounded
   conversation evidence establishes it.
5. Retrieve each exact queue/reference through its List View row menu as well.
   Use the same direct-download default and validated DOM recovery boundary as
   the bundle rows.
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
2. Add detailed, evidence-backed, sanitized findings to the experiment log or
   other canonical tracked memory. Include useful operational results, timing,
   errors, and available token or usage evidence. Sanitize by excluding raw
   chats, credentials, private intake, account identifiers, personal details,
   and other genuinely private material; do not remove diagnostic detail merely
   to call the record sanitized. Preserve
   classifier and workflow annotations even when the malformed bundle omitted
   them but the canonical queue and bounded conversation evidence establish
   them exactly.
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
2. When that ChatGPT Project update is required, identify the exact merged or
   review-ready prompt or every exact source file and Project destination. After
   the qualifying PR merges, use SafariDriver MCP to apply the verified merged
   version in the live Project UI and verify the resulting prompt or source
   listing. Do not ask Brad to perform or confirm this synchronization. If the
   UI cannot be changed after the required MCP availability re-check, report the
   exact technical blocker rather than requesting permission. Update the
   repository's live-version record in the active PR or a focused follow-up.
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
   applicable risk tier. When checks and actionable review threads are clean,
   merge the qualifying commute PR under the standing authorization for this
   workflow; do not pause to ask Brad again.

## Post-merge artifact cleanup

Cleanup of transient source artifacts is destructive. `AGENTS.md` records
Brad's standing authorization for the exact queue, validated v4-reference, and
session-bundle artifacts consumed by durably completed commute runs. Record the
standing authorization and exact targets in the private retrieval manifest; do
not ask Brad for additional per-run or per-artifact authorization. Cleanup may
begin only after processing is durably complete:

After the gated merge, pull `main` and verify the repository before cleanup.
Complete already-authorized exact cleanup and the final handoff without asking
Brad to repeat authorization already recorded in `AGENTS.md`; report any
mandatory environment safety confirmation precisely. If the browser presents an
action-time confirmation for an exact authorized target, confirm it and proceed.
Do not pause for or request another confirmation.

1. If the run has a PR, do not delete anything until that exact PR is merged.
   An open, draft, closed-unmerged, or checks-pending PR leaves cleanup pending.
   If the run has a justified no-change result and no PR, cleanup may begin only
   after the complete no-change handoff is recorded.
2. Resolve cleanup targets from the private retrieval manifest and inventory
   each Library location independently in List View. Use each exact row's
   three-dot menu. In the main ChatGPT Library, delete only the exact queue and
   validated v4 reference rows consumed by the completed run. In the
   `LLM-Wiki-Car` Project Library folder, separately delete only the exact
   commute-session bundle rows consumed by that run. A successful deletion in
   one location does not establish deletion of its matching copy in the other.
   Treat the Project Sources view as independent from the main Library and
   preserve unrelated Project sources.
   Do not delete the Project Library folder itself, shared chats, Project source
   documents, schemas, prompts, unrelated dated artifacts, or a plausible row
   that was not validated into the final intake.
3. In `~/Downloads`, remove only the exact queue, validated v4 reference, and
   bundle downloads created or verified during this run. Match filenames and,
   when duplicate suffixes or pre-existing same-name files exist, confirm
   content against the private intake before removing them. Prefer moving local
   files to Trash; never use a broad glob or recursive deletion.
4. Keep the normalized `.private/` intake, coverage ledger, and retrieval
   manifest as the durable audit and recovery record. Library and Downloads are
   transient copies; `.private/` is not part of this cleanup request.
5. Reopen and inventory the main Library and the `LLM-Wiki-Car` Project Sources
   view after deletion. Verify that every targeted queue and validated v4
   reference row is absent from the main ChatGPT Library, every targeted bundle
   row is absent from the Project
   Library/Sources view, every unrelated Project source remains, and every
   targeted Downloads file is absent. Then append the exact targets, deletion
   time, and per-location verification result to the private retrieval manifest.
   Report partial failures precisely and leave unmatched or ambiguous files
   untouched.

When cleaning historical residue, build the allowlist from merged repository
history plus preserved private intake. A matching date or artifact-shaped name
alone is insufficient: require durable evidence that the exact queue or bundle
was validated and consumed into a completed commute result. Apply the same
preservation, exact-match, verification, and audit rules as the current run.

Keep the original task and worktree responsible for post-merge cleanup because
its gitignored private manifest does not follow a new isolated worktree. If
Codex is not active when the PR later merges, record cleanup as pending for the
next run. If the original context is unavailable, do not delete from a guessed
target list: re-inventory the Library and Downloads and re-establish exact
filenames and content matches before removing anything under the standing
authorization.

## Completion

Report the remote branch, commit, PR, CI/review state, issue updates, evidence
counts, Library retrieval results, and any genuinely unresolved item. Explicitly
report conversation coverage: substantive entries audited, wiki saves reflected
with discussion context, classifier/quality annotations retained, workflow
observations routed, issue comment URLs, and any excluded entries with reasons.
Do not call the daily loop complete while a required ChatGPT Project prompt
replacement or named source-document upload is unapplied or unverified. Keep
that concrete update visible as a pre-merge checklist item, but do not change the
PR's draft/ready state because of it; ready for review is compatible with pending
post-merge synchronization. For every changed live prompt, use the exact merged
file contents; never reconstruct them from memory and never make Brad remember
to ask or confirm.
When a PR exists, make its clickable URL the final content in every completion
handoff. Render it as a level-one Markdown heading with a bold linked label so it
is large and cannot be buried; place no text, list item, or footer after it.
