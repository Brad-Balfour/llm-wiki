# LLM-Wiki-Car Project Source Bundle

> Status: `LLM-Wiki-Car` is the one live ChatGPT Project for both weekday queue
> generation and Voice commute playback. Queue v2 is the only supported queue
> contract. Git history preserves the retired prompts, ledgers, handoffs, and
> approval workflow for debugging; do not keep them as live Project sources.

## Project Instructions

Paste `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md` into the **Instructions**
field of `LLM-Wiki-Car`. It supersedes the former commute prompt and the
earlier separate-Project v2 Pilot.

The prompt heading carries two distinct versions. `Queue Contract v2` changes
only when the queue/schema contract changes. `Prompt Revision` increments for
every behavior-changing Project-instruction edit, so the text pasted into
ChatGPT can be identified independently of Git history.

## Live Project Sources

Upload exactly these files to `LLM-Wiki-Car`:

- `schema/tldr-commute-queue-v2.schema.json`
- `schema/commute-session-bundle-v1.schema.json`
- `chatgpt-project/queue-generation-v2.md`
- `schema/interest-profile.md`
- `schema/classifier-instructions.md`
- `schema/routing-rules.md`

The scheduled **Weekday TLDR Queues** Task uses
`chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2.md` as its managed prompt.
The live body was verified as an exact match on July 26, 2026. The Task remains
Monday–Friday at 11:00 AM and is active.

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
to the dated v2 filename in its Library; it must not guess a nearby queue.

Do not upload the legacy `commute-session-handoff.md`,
`commute-session-ledger.md`, `wiki-ingestion.md`, any `commute-handoff` schema,
or `approved-wiki-source-v1.schema.json` as live Project sources. They conflict
with the v2 single-queue/session-bundle path. Their Git history remains the
rollback record.

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
only its explicitly marked wiki saves by placing `--recover-with` immediately
after that bundle's `--input`. The supplied queue must have exactly the filename
the malformed bundle declares; local tools cannot read the private Project
Library themselves.

```sh
npm run import:commute-session-bundles -- \
  --input /path/to/malformed-bundle.txt \
  --recover-with /path/to/named-queue.txt \
  --output .private/commute-session-imports/recovered.json
```

The deliberately retired v1 queue prompt, schema, fixture, and separate-Project
Pilot prompt are absent from this working tree. They are recoverable from Git
history, but must not be uploaded alongside v2 sources.

After downloading a v2 queue, the home-side deterministic preflight is:

```sh
npm run validate:commute-queue -- /path/to/queue.txt
```

## Post-Commute Bundle Intake

The supported user workflow is chat-mediated: supply the original downloaded
queue file(s) and session bundle(s) to a repository maintenance/debug chat and
ask the agent to debug and process them. The agent invokes the package scripts
below to validate and import each session independently. Brad does not need to
combine queues, bundles, or conversations, and does not need to run a
human-facing consolidated CLI.

The importer keeps every valid session even when another is malformed and
writes a private normalized intake record. Exact `wiki this` captures become
pending maintenance candidates without another approval step; classifier
corrections, product-quality incidents, and unresolved captures stay in their
separate private lists.

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
