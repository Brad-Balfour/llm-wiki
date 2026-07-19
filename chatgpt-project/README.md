# ChatGPT Project Source Bundle

> Status: Queue v2 is the only supported queue contract in this worktree. Its
> managed files define the manually deployed ChatGPT Project configuration. Git
> history retains the retired v1 prompt and schema if they are ever needed for
> debugging.

Use the repository files below as source knowledge for the LLM-Wiki ChatGPT
Project.

## Queue v2 Cutover Sources

- `schema/tldr-commute-queue-v2.schema.json`
- `chatgpt-project/queue-generation-v2.md`
- `chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2.md`
- `chatgpt-project/CHATGPT_CAR_QUEUE_PILOT_V2_PROMPT.md`
- `schema/commute-session-bundle-v1.schema.json`

## Classification And Routing Reference

- `schema/interest-profile.md`
- `schema/classifier-instructions.md`
- `schema/routing-rules.md`

## Wiki Ingestion

- `chatgpt-project/wiki-ingestion.md`
- `schema/approved-wiki-source-v1.schema.json`

The synonymous commute commands are "End commute" and "End the commute session."
The retired "Approve this for wiki ingestion" command is not part of the v2
path: an exact `wiki this` capture is sufficient to nominate maintenance.

## J2-J4 Pilot Source Bundle

For the controlled queue-pointer test, the temporary Pilot uses
`CHATGPT_CAR_QUEUE_PILOT_V2_PROMPT.md` plus both
`schema/tldr-commute-queue-v2.schema.json` and the session-bundle schema. The
Pilot ignores legacy ledger, v2-handoff, and approval-command paths. Its output
can be checked locally against the original downloaded queue with:

```sh
npm run validate:commute-session-bundle -- \
  --input /path/to/session-bundle.txt \
  --queue /path/to/selected-queue.txt
```

The deliberately retired v1 queue prompt, schema, fixture, and Pilot prompt
are absent from this working tree. They are recoverable from Git history, but
must not be uploaded alongside v2 sources.

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
forthcoming top-level commute-maintenance command will invoke this intake,
retrieve nominated sources, inspect the existing wiki, and create a branch/PR
automatically. Its normal human decision point is the resulting PR—not an
intermediate review of this private record.
