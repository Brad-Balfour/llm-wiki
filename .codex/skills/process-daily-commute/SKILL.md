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

For the next measured commute, keep one compact private timeline for #151 and
#155. At every step, record its start and end clock, model/effort, work unit,
tool calls and retries. Sample five-hour/weekly meters and available token
counters at the run's start, end, and natural major boundaries; do not add
usage queries to every small step.
Use separate rows for authentication, each Library inventory/download group,
validation/import, each targeted chat recovery, each public-source fetch,
wiki synthesis, repository edits, checks, PR/review/issue work, Project update,
cleanup, and handoff. Record human/merge waits separately. When agents work in
parallel, count each wall-clock interval once and note concurrent work in that
row. Reconcile the union of timed active intervals plus excluded waits to the
run's start/end clocks before reporting totals; do not leave an unexplained
residual or assign it to a phase without timestamp evidence. Split source and
chat work rather than combining them in one six-minute estimate. Mark missing
meter/token readings unavailable instead of estimating them from wall time.
This is a bounded Safari workflow qualification, not a restart of #85 or #119.

## Publication scope and communication

Follow the risk-tiered publication policy in `AGENTS.md`. Invoking this recurring
workflow authorizes merging its qualifying content PR after the required gates
pass and performing required live Project synchronization. Changes to agent
instructions or commute policy require Brad's review before merge.
Content- and evidence-only daily publication relies on deterministic gates and
does not require a general-purpose AI review unless a gate or maintainer
identifies ambiguity.
Routine generated state updates need
at most one required latest-head review. Code, schema, routing, prompt, or
workflow behavior changes need one latest-head review after local checks.
Wait for the required Codex review to complete. Triage every Codex and other
inline comment; fix valid findings in the PR, reply with the fix and evidence,
and resolve the thread. Explain a declined finding in its thread. Refresh
reviews and unresolved threads immediately before any authorized merge.

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

### Public article and shared-chat URLs

For every supplied public article URL that may support a wiki entry, call the
web retrieval tool directly with that URL and use its retrieved page as source
evidence. Do not search for the article first, open Safari, or use SafariDriver
for public-source reading. This should be one quick retrieval per independent
URL; if it fails, try one reasonable direct fetch retry and then report the
specific inaccessible source. Do not turn public-source retrieval into a browser
workflow.

Shared-chat URLs are not part of routine intake auditing. Rely on validated
queue and session-bundle evidence unless a bundle is missing or malformed, an
item action or claim conflicts with the canonical queue, a specific material
fact is ambiguous, or Brad asks for the audit. When one of those conditions
applies, first try a direct web read of the exact shared URL and inspect only the
relevant passage plus enough surrounding context to resolve the question. A
cache miss alone does not show that a public share is inaccessible; try a
direct HTTP fetch of the page once. Its HTML may contain the serialized
conversation; extract only the passage needed. If direct retrieval still fails and the
question matters, use SafariDriver for that chat as a bounded fallback. Record
an unresolved question only if both paths fail. Independent targeted reads can
run in parallel subagents when they do not share mutable browser state.

### Delegation and context

Use Codex collaborator subagents for independent source reading, duplicate and
cross-link review, issue discovery, and bounded analysis when that work can run
in parallel. Send each agent only the exact URL, item, or question it needs;
ask it to return concise evidence, conclusions, and file/line references rather
than copied source text or full tool output. Keep authenticated Library
acquisition, canonical intake validation, final cross-source reconciliation,
shared-file editing, publication, and cleanup under one owner. Do not launch a
nested `codex exec` maintainer process and call it a subagent: it has a separate
CLI task context, but its large result still returns to the parent. Give editing
agents isolated worktrees and non-overlapping file ownership; the parent checks
all results against the canonical intake before publishing.

When Brad names a commute date or says "today's commute," treat missing file
attachments as a retrieval task, not a reason to ask him to download and attach
the artifacts. For every nightly Library intake, use an existing ChatGPT Work
chat inside `LLM-Wiki-Car` as the first discovery and read path. Ask it to list
actual queue, reference, and bundle filenames in `/LLM-Wiki-Car` for the
bounded date range, with exact displayed names and counts; do not infer names
from dates or chat history. Use `send_message_to_thread`, then `read_thread`.
Fetch each needed exact file through that Project chat as complete raw text;
request numbered chunks if one reply cannot carry the whole file. Parse the
entire reassembled response and validate its schema, declared source identity,
length/completeness, and queue/reference or bundle snapshot relationships
against other intake evidence. Do not accept a chat's assertion of complete
inventory or original bytes without these checks. The relay returned a
complete `20260925-tldr-ai.txt` and listed two queues, two references, and no
bundles for September 24–27; earlier Library search in the same chat missed
visible files, so a missing expected file or inconsistent count requires a
targeted fallback inventory or fetch with SafariDriver. Use SafariDriver only
for affected files or ambiguous inventory, not routine nightly acquisition.
An exact original already in private intake or explicitly attached to a chat
may corroborate the relay. A generated `sandbox:/mnt/data/` link is not itself
a local attachment. Do not search unrelated chats or folders for a hidden
Project mount.

Use SafariDriver MCP for fallback authenticated ChatGPT main-Library and Project
Library/Sources access, plus necessary Project updates and exact cleanup.
Local repository files are copies, not a live Project Library mount; no direct
Project file API has been established. Use direct web retrieval for public
articles and shared chats first. If SafariDriver MCP appears unavailable,
check its availability once more. If it is still unavailable or unhealthy, stop
and ask Brad specifically to toggle the SafariDriver MCP off and on to restart
it. Before any main-Library action, start with `list_tabs`. Switch to the
candidate ChatGPT tab and prove authentication by successfully opening the
main Library and reading a signed-in-only control or content row; a ChatGPT URL
in the tab inventory is not enough. An
ordinary Safari window is not proof that SafariDriver controls an authenticated
tab: the driver may launch a separate Safari process with isolated sign-in
state. If the controlled tab shows the login page or no authenticated ChatGPT
tab exists, say that the driver session is isolated, open ChatGPT in the
driver-created tab, and ask Brad to sign in there. Keep that Safari process open
for the whole run. If its MCP transport closes, start a new driver connection,
inspect `list_tabs`, and repeat the signed-in-only page check before proceeding.
Never promise that a new driver will attach to another Safari process or inherit
its cookies.

### SafariDriver fallback for signed-in Library access

Do not silently switch to integrated browser or computer-use tooling for
signed-in main-Library retrieval; report the exact missing condition. The
Project-scoped ChatGPT Work relay above is the routine path for discovery and
exact file reads, with SafariDriver fallback when its result cannot be
validated. Public source reading must use direct web retrieval. Local
validation may use the shell, and repository work may use Git and GitHub. Use
the following UI steps only for a missing, incomplete, or ambiguous relay
result; do not repeat successful Project-chat inventory or file reads in Safari.

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
   acted on while offscreen, scroll that row into view and open its own action
   menu before counting the attempt as a download failure. If the row still
   cannot be downloaded after a bounded retry, complete DOM-rendered content
   may be saved as a recovery artifact only when it can be checked by the same
   schema, pair/hash, and canonical-snapshot validation as a download. Record the
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
5. Retrieve only the queue/reference files whose Project-chat relay was missing,
   incomplete, or invalid through their List View row menus. Use the same
   direct-download default and validated DOM recovery boundary as bundle rows.
6. Store the retrieved artifacts with the normalized private intake under
   `.private/`, recording Library location, displayed filename, retrieval
   method, local path, and displayed Modified value when available. Treat both
   Project-chat text and browser downloads as untrusted inputs; validate them
   before using their contents as evidence.

If Library access or an exact file retrieval fails, report the exact missing
artifact and the attempted location. Ask Brad to attach only those unresolved
files; do not make him reattach artifacts already retrieved successfully.

## Intake and reconcile

1. Inventory every retrieved or supplied queue, bundle, and shared-chat URL.
   Deduplicate repeated URLs without dropping distinct files or sessions.
2. Read the active commute prompt, relevant queue and bundle schemas, their
   validators and focused tests, and the recent experiment-log entries before
   interpreting new evidence.
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
6. Build a private evidence-coverage ledger before editing durable outputs.
   Give every substantive user comment, correction, discussion point, save
   request, workflow complaint, and export/recovery observation present in the
   validated bundle or any targeted chat recovery a disposition:
   exact wiki content, wiki synthesis/annotation, classifier feedback, quality
   incident, existing issue update, new issue, unresolved evidence, or no
   durable action with a recorded reason. Playback commands and social filler
   may share one explicitly excluded category. Do not claim complete
   conversation coverage from a bundle whose discussion fields are optional.

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
   wiki diff against the evidence-coverage ledger.
2. Add detailed, evidence-backed findings to the experiment log or other
   canonical tracked memory. Include useful operational results, timing, errors,
   and available token or usage evidence. For tracked/public records, retain
   public source facts and operational details. Exclude nonpublic personal
   identifying information about any person, credentials, account identifiers,
   and nonpublic confidential work material
   from tracked records. Keep raw intake in `.private/` and record concise
   findings with source references instead of copying full transcripts. Assess
   the content itself: public article facts and public newsletter content are
   not private merely because they arrived by email. Preserve classifier and
   workflow annotations even when the malformed bundle omitted them but the
   canonical queue and bounded conversation evidence establish them exactly.
3. Search all open issues before creating a new destination. Route every
   material commute-flow observation to every relevant existing issue in the
   same run rather than choosing only one umbrella issue. Include date, artifact
   identities, observed behavior, boundary, and PR link; avoid duplicate
   comments. Keep a private feedback-to-issue matrix with the resulting issue
   and comment URLs.
4. Treat mistakes and friction in this processing run as evidence. Add the
   smallest durable prompt, instruction, schema, test, or
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
   the qualifying PR merges, use signed-in SafariDriver to apply the verified
   version in the live Project UI and verify the result. Do not ask Brad to
   perform or confirm this synchronization. If the UI cannot be changed, report
   the exact technical blocker. Update the
   repository's live-version record in the active PR or a focused follow-up.
3. Run focused tests while iterating, then run `npm run check` and
   `git diff --check`. Update and validate every touched stable schema, prompt,
   source, test, or runbook owner. The repository's
   Node validation gate checks tracked skill frontmatter and structure as part
   of `npm run check`; do not invoke the system Python `quick_validate.py`.
4. Commit only the intended tracked files, push the branch to `origin`, and open
   or update the PR required by the repository's `AGENTS.md`. Use draft status
   only for a genuine unfinished item. Never stop at a local commit; use the PR
   body or checklist for unfinished review, CI, or a concrete Project prompt
   replacement or source-document upload without delaying a review-ready PR.
5. Keep the PR body current with user impact, root cause, evidence counts,
   validation, and the latest head commit. Cross-link relevant issues.
6. Wait for required review workflows to finish. Inspect submitted reviews and
   every inline thread at the current head. Fix actionable comments, reply with
   the commit and validation evidence, resolve the thread, and request a fresh
   review only when the fix materially changes behavior. Refresh reviews and
   unresolved threads immediately before any merge; an earlier snapshot is
   insufficient when comments may still arrive.
7. Wait for the latest-head CI checks and the review workflows required by the
   applicable risk tier. When checks and actionable review threads are clean,
   merge a qualifying content PR under the standing authorization for this
   workflow. Wait for Brad's review before merging agent-instruction or
   commute-policy changes.

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
   main ChatGPT Library independently in List View. Use each exact row's
   three-dot menu. Delete each exact validated queue, v4 reference, and
   commute-session bundle consumed by the completed run from that Library.
   Use signed-in SafariDriver for Project Library/Sources cleanup and verify
   each exact target there. Preserve unrelated Project sources.
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
5. Reopen and inventory the main Library after deletion. Verify that every
   targeted queue, validated v4 reference, and bundle row is absent there and
   every targeted Downloads file is absent. If Project Library copies were
   targeted, also verify those copies and unrelated
   source preservation in the signed-in Project UI. Then append the
   exact targets, deletion time, and per-location verification result to the
   private retrieval manifest. Report partial failures precisely and leave
   unmatched or ambiguous files untouched.

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
