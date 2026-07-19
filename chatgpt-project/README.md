# ChatGPT Project Source Bundle (Current Legacy Configuration)

> Status: These files are the currently deployed Project configuration. The
> successor requirements are in `openspec/changes/commute-wiki-operating-loop/`.
> Do not change the live-ledger, v2-handoff, or approval-command instructions
> until their tested replacements are implemented.

Use the repository files below as source knowledge for the LLM-Wiki ChatGPT
Project.

## Classification And Routing

- `schema/interest-profile.md`
- `schema/classifier-instructions.md`
- `schema/routing-rules.md`
- `schema/tldr-commute-queue-v1.schema.json`

## Commute Queue And Handoff

- `chatgpt-project/queue-generation.md`
- `chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT.md`
- `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`
- `chatgpt-project/commute-session-ledger.md`
- `chatgpt-project/commute-session-handoff.md`
- `schema/commute-handoff-v2.schema.json`

## Wiki Ingestion

- `chatgpt-project/wiki-ingestion.md`
- `schema/approved-wiki-source-v1.schema.json`

The synonymous commute commands are "End commute" and "End the commute session."
The explicit public wiki
preparation command is "Approve this for wiki ingestion."

## J2-J4 Pilot Source Bundle

For a controlled single-queue Voice-session test, create a separate temporary
Project using `CHATGPT_CAR_QUEUE_PILOT_PROMPT.md` and make
`schema/commute-session-bundle-v1.schema.json` available to it. Do not replace
the production LLM-Wiki-Car Project instructions: its scheduled queue-generation
Task depends on them. The pilot explicitly ignores the legacy ledger, v2
handoff, and approval-command paths. Its output can be checked locally against
the original downloaded queue with:

```sh
npm run validate:commute-session-bundle -- \
  --input /path/to/session-bundle.txt \
  --queue /path/to/selected-queue.txt
```

Do not remove the legacy files until the default-change criteria pass.
