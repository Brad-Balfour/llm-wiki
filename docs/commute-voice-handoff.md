# Commute Voice Handoff

The Monday prototype uses a manual, private-by-default bridge from ChatGPT Voice
to this repository. It does not depend on a custom voice API or direct ChatGPT
Library integration.

## Before Driving

1. Add these project source files to the LLM-Wiki ChatGPT Project:
   - `chatgpt-project/queue-generation.md`
   - `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`
   - `chatgpt-project/commute-session-ledger.md`
   - `chatgpt-project/commute-session-handoff.md`
   - `schema/commute-handoff-v2.schema.json`
2. Start a new chat in the Project.
3. Attach the prepared queue `.txt` file from the ChatGPT Library folder named
   `LLM-Wiki-Car`.
4. Confirm that the chat recognizes the queue and starts in the intended mode.
5. Switch to Voice only after the phone-based workflow is ready and before the
   vehicle is moving.

## End Of Session

Say one phrase:

> End commute.

or the synonym:

> End the commute session.

The Project source instructions tell ChatGPT to stop the queue, reconstruct the
handoff from the attached queues and structured session ledger, validate it
against the currently loaded v2 schema, create a new
`YYYYMMDD-tldr-commute-handoff.txt` file, and confirm when it is ready. Corrected
attempts use `-r2`, `-r3`, and so on instead of replacing an earlier artifact.
No longer-form prompt is required.

## At Home

Download the generated `.txt` file from ChatGPT Library and run:

```bash
npm run import:commute-handoff -- --input ~/Downloads/20260713-tldr-commute-handoff.txt
```

The command accepts legacy v1 files and validates v2 queue completion and exact
resume state before writing normalized JSON under
`.private/commute-handoffs/`. That directory is gitignored. The write is
create-only, so importing the same session twice fails instead of overwriting
the first record.

Review the normalized record before promoting anything into feedback labels,
source notes, or the public wiki. `range_review` notes remain private and must
never be committed to the public repository.

## Why `.txt`

JSON is the content format, while `.txt` is the transport wrapper. ChatGPT's
official file guidance explicitly supports TXT. JSON file upload behavior is
less clearly documented and has varied in the observed workflow.

## Known Limitation

Voice transcripts are useful recovery evidence but are not guaranteed to match
the spoken conversation exactly. The structured handoff should contain only
explicitly confirmed actions and notes; the importer intentionally rejects a
top-level `transcript` field.
