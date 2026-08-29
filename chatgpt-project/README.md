# LLM-Wiki-Car Project Source Bundle

> Status: `LLM-Wiki-Car` is the one live ChatGPT Project for both weekday queue
> generation and Voice commute playback. Queue v3 is the active contract;
> local validation and bundle import keep explicit queue-v2 compatibility for
> already-downloaded artifacts.
> Git history preserves the retired prompts, ledgers, handoffs, and approval
> workflow for debugging; do not keep them as live Project sources.

## Project Instructions

Paste `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md` into the **Instructions**
field of `LLM-Wiki-Car`. It supersedes the former commute prompt and the
earlier separate-Project v2 Pilot.

The repository file is Prompt Revision 4.1 and is the active source for the
deployed queue-v3 configuration.

The prompt heading carries two distinct versions. `Queue Contract v3` changes
only when the queue/schema contract changes. `Prompt Revision` increments for
every behavior-changing Project-instruction edit, so the text pasted into
ChatGPT can be identified independently of Git history.

## Live Project Sources

Upload exactly these files to `LLM-Wiki-Car`:

- `schema/tldr-commute-queue-v3.schema.json`
- `schema/commute-session-bundle-v1.schema.json`
- `chatgpt-project/queue-generation-v3.md`
- `schema/interest-profile.md`
- `schema/classifier-instructions.md`
- `schema/routing-rules.md`

## Rollback-Aware Versioning

A prompt is not always the only thing changing observable behavior. Tool
schemas, retrieval and context policy, model/runtime settings, classifier
instructions, routing, and the interest profile may also matter. When several
of these change together—or when a change has enough risk to justify the
overhead—recording the materially coupled versions makes a failed experiment
easier to understand and roll back.

This is a design heuristic, not a mandatory release manifest or a requirement
to run the entire workflow for every edit. Use judgment and validation
proportional to the change. The practical goal is simply to avoid a partial
rollback that restores a prompt while leaving another behavior-changing
dependency behind.

The active scheduled **Weekday TLDR Queues** Task uses
`chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V3.md`. The Task remains
Monday–Friday at 11:00 AM and is active. The v2 prompt is retained only for
history and compatibility with already-downloaded v2 artifacts.

Scheduled execution is currently unreliable at the artifact boundary. July
21-24 and July 28 runs found the expected Gmail messages, then every
file-generation path failed with the same generic
`oai_http_clients.client.ClientError`. Manual July 24 and July 28 controls in
this same Project created the expected queue files. Until issue #37 passes its
acceptance runs, generate queues in a manual Project chat with the same prompt
when the scheduled run does not produce real downloads. Do not rewrite queue
logic or claim success from the Task's `Last ran` status. See
`docs/live-workflow-audit-2026-07-26.md` and
`docs/commute-experiment-log.md`.

Voice may start a queue by an exact filename or an unambiguous date plus
newsletter name, such as `July 16 TLDR Dev`. The Project normalizes that request
to the dated v3 filename in its Library; it must not guess a nearby queue.

Do not restore retired handoff, ledger, wiki-approval, or compiler artifacts
from Git history as live Project sources. They conflict with the supported v3
single-queue/session-bundle path.

The synonymous commute commands are "End commute" and "End the commute
session." An exact `wiki this` capture is sufficient to nominate maintenance;
there is no user-facing approval command in this path.

## Bundle Validation

The Voice output can be checked locally against the original downloaded queue
with:

```sh
npm run validate:commute-session-bundle -- \
  --input /path/to/session-bundle.txt \
  --queue /path/to/selected-queue.txt
```

If an older malformed bundle names its queue but omitted its snapshot, recover
its explicitly marked wiki saves and any independently well-formed non-item
quality incidents or general captures by placing `--recover-with` immediately
after that bundle's `--input`. The supplied queue must have exactly the filename
the malformed bundle declares; local tools cannot read the private Project
Library themselves. Unsupported non-item observations are warnings, not a reason
to reject the recovered session.

Bundle artifact filenames are not recovery identity. If an LLM emits a missing,
noncanonical, contradictory, or differently downloaded bundle filename, local
intake preserves that defect as a warning and continues when the supplied queue,
item, and explicit wiki action remain exact. Strict bundle validation still
reports the naming defect so generator quality does not become invisible.

```sh
npm run import:commute-session-bundles -- \
  --input /path/to/malformed-bundle.txt \
  --recover-with /path/to/named-queue.txt \
  --output .private/commute-session-imports/recovered.json
```

The deliberately retired v1 queue prompt, schema, fixture, and separate-Project
Pilot prompt are absent from this working tree. They are recoverable from Git
history, but must not be uploaded alongside v3 sources. Existing downloaded v2
queues remain valid local input and are not rewritten: v2 uses `summary` and has
no `playback_text`; newly generated v3 queues use `description` and require the
deterministic `playback_text`.

After downloading a v3 queue, the home-side deterministic preflight is:

```sh
npm run validate:commute-queue -- /path/to/queue.txt
```

## Post-Commute Bundle Intake

The supported user workflow is chat-mediated: supply the original downloaded
queue file(s) and session bundle(s) to a repository maintenance/debug chat and
ask the agent to process them. Brad does not need to combine queues, bundles,
or conversations. The agent starts with one deterministic orchestration command:

```sh
npm run commute:run -- \
  --input /path/to/morning-bundle.txt \
  --recover-with /path/to/named-queue.txt \
  --input /path/to/evening-bundle.txt \
  --shared-chat https://chatgpt.com/share/example \
  --output .private/commute-runs/20260720.json
```

`commute:run` inventories and reconciles every supplied artifact, compares
recovery queues to embedded snapshots, retains all normalized evidence in one
private versioned record, and lists unresolved evidence without deciding its
meaning. Add `--github-pr OWNER/REPO#NUMBER` to capture one batched PR-state
snapshot, or also `--watch-seconds 1..900` for a bounded watcher. A GitHub
failure is recorded in the private result and never discards validated local
intake. The command does not retrieve a shared chat, make subjective
wiki/classifier decisions, create a PR, or merge; those remain explicit agent
work after the deterministic record is available.

The importer keeps every valid session even when another is malformed and
writes a private normalized intake record. Exact `wiki this` captures become
pending maintenance candidates without another approval step; classifier
corrections, product-quality incidents, and unresolved captures stay in their
separate private lists. When an exact `wiki this` capture has supported
surrounding discussion, the bundle may include an optional item-bound discussion
record with a concise summary, questions, conclusions, requested emphasis, and
direct evidence. Do not infer this record from proximity to another save or
general capture, and do not refuse the bundle when no such record is available.

```sh
npm run import:commute-session-bundles -- \
  --input /path/to/morning-bundle.txt \
  --input /path/to/evening-bundle.txt \
  --output .private/commute-session-imports/20260720.json
```

The top-level maintainer accepts the same adjacent `--recover-with` form when
you want recovery and wiki maintenance in one run.

These commands are agent-invoked implementation stages and diagnostics, not
user approval gates. Keep them available rather than combining or removing
them solely to create a human-facing command surface. The
`maintain:commute` command composes intake, retrieval, existing-wiki inspection,
and branch/PR creation when that full pass is appropriate. Its normal human
decision point is the resulting PR—not an intermediate review of the private
record. That private `intake.json` stores append-only retrieval/maintainer
attempts and a derived latest result for every attempted maintenance candidate.
When retrying the same bundle/event/URL candidate in a new private output
directory, the agent passes the earlier record with
`--prior-intake .private/.../intake.json`. The command rejects mismatched prior
candidate identity instead of treating it as unrelated history, and it skips
candidates whose latest result already created a PR.
Per-candidate maintainer statuses are closed values: `pr_created`, `no_change`,
`insufficient_source`, `unresolved`, or `failed`; change specifics belong in
the result detail. If the maintainer reports a PR but its candidate results
cannot be reconciled safely, the intake records `review_required` and blocks an
automatic retry until that PR is inspected, avoiding duplicate maintenance.
Review early maintainer diffs with
[`docs/wiki-maintainer-pr-review.md`](../docs/wiki-maintainer-pr-review.md);
the checklist distinguishes duplicate concepts, material existing-page updates,
useful link-only changes, and inaccessible-source outcomes without adding an
intermediate approval gate.

Before the first real bundle-to-PR run, confirm that the local maintainer can
launch the installed Codex command without changing the repository:

```sh
npm run diagnose:maintain-commute
```

It uses `COMMUTE_MAINTAINER_CODEX` when explicitly set; otherwise it invokes
the Codex executable bundled with the ChatGPT macOS app. This deliberately
avoids a broken global `codex` npm launcher.
