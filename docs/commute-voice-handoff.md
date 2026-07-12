# Commute Voice Handoff

The Monday prototype uses a manual, private-by-default bridge from ChatGPT Voice
to this repository. It does not depend on a custom voice API or direct ChatGPT
Library integration.

## Before Driving

1. Add these three project source files to the LLM-Wiki ChatGPT Project:
   - `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`
   - `chatgpt-project/commute-session-handoff.md`
   - `schema/commute-handoff-v1.schema.json`
2. Start a new chat in the Project.
3. Attach the prepared queue `.txt` file from ChatGPT Library.
4. Confirm that the chat recognizes the queue and starts in the intended mode.
5. Switch to Voice only after the phone-based workflow is ready and before the
   vehicle is moving.

## End Of Session

Say one phrase:

> End the commute session.

The Project source instructions tell ChatGPT to stop the queue, create the
validated `YYYYMMDD-tldr-commute-handoff.txt` file, and confirm when it is ready.
No longer-form prompt is required.

## At Home

Download the generated `.txt` file from ChatGPT Library and run:

```bash
npm run import:commute-handoff -- --input ~/Downloads/20260713-tldr-commute-handoff.txt
```

The command validates the handoff and writes normalized JSON under
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
