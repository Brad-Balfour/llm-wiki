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
That Task remains Monday–Friday at 11:00 AM.

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

The deliberately retired v1 queue prompt, schema, fixture, and separate-Project
Pilot prompt are absent from this working tree. They are recoverable from Git
history, but must not be uploaded alongside v2 sources.

After downloading a v2 queue, the home-side deterministic preflight is:

```sh
npm run validate:commute-queue -- /path/to/queue.txt
```

## Post-Commute Bundle Intake

One command accepts one or more downloaded session bundles, keeps every valid
session even when another is malformed, and writes a private normalized intake
record. Exact `wiki this` captures become pending maintenance candidates without
another approval step; other feedback, incidents, and unresolved captures stay
in their separate private lists.

```sh
npm run import:commute-session-bundles -- \
  --input /path/to/morning-bundle.txt \
  --input /path/to/evening-bundle.txt \
  --output .private/commute-session-imports/20260720.json
```

This command is an internal/diagnostic stage, not a user approval gate. The
top-level `maintain:commute` command invokes this intake, retrieves nominated
sources, inspects the existing wiki, and creates a branch/PR automatically. Its
normal human decision point is the resulting PR—not an intermediate review of
this private record.

Before the first real bundle-to-PR run, confirm that the local maintainer can
launch the installed Codex command without changing the repository:

```sh
npm run diagnose:maintain-commute
```

It uses `COMMUTE_MAINTAINER_CODEX` when explicitly set; otherwise it invokes
the Codex executable bundled with the ChatGPT macOS app. This deliberately
avoids a broken global `codex` npm launcher.
