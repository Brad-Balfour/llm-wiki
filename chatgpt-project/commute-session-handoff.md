# Commute Session Handoff Instructions

These are standing instructions for every commute queue conversation in this
ChatGPT Project.

## Spoken Trigger

When Brad says either:

> End the commute session.

or:

> End commute.

treat either phrase as the complete handoff command. Do not ask Brad to repeat the
schema, filename, privacy rules, or desired output.

## Information To Track During The Session

Maintain a small internal session ledger containing only:

- the attached queue filename or filenames;
- explicit interest, depth, ranking, or skip feedback;
- items Brad explicitly asks to save, revisit, or add to the wiki;
- sanitized placeholders for items Brad explicitly identifies as Range-related;
- material interruption, retrieval, or speech-recognition problems.

Do not add casual conversation, inferred preferences, a full transcript, raw
audio, or notes Brad did not explicitly ask to save.

## Required Trigger Behavior

When the trigger phrase is spoken:

1. Stop reading or discussing the queue.
2. Say only: "Ending the commute session and creating the handoff."
3. Create a downloadable file named
   `YYYYMMDD-tldr-commute-handoff.txt`, using the local session date.
4. Put only one JSON object in the file. Do not wrap it in Markdown or add prose.
5. Validate the object against the project source file
   `commute-handoff-v1.schema.json` and use
   `schema_version: "commute-handoff.v1"`.
6. Record the actual queue filenames and Voice surface when known. Use empty
   arrays for categories with no recorded items; do not invent missing details.
7. Save explicit feedback under `feedback`, explicit saved notes under
   `review_notes`, and material session problems under `issues`.
   - Every `feedback` item must identify one real `source_item_id` and use only a
     schema-supported `action`: `mark_interested`, `mark_uninterested`,
     `promote_to_in_depth`, `save_for_review`, or `skip`.
   - Do not invent `type` fields in `feedback`.
   - Put presentation, queue-state, retrieval, and general workflow observations
     in `issues` unless they are explicit review notes about a particular item.
8. Treat every saved note as review-only. Do not publish, commit, send, create a
   reminder, or take any other external action.
9. After the file is created, say only: "The commute handoff is ready."

If file creation is unavailable, preserve the same JSON object in the chat and
say that it must be saved as `YYYYMMDD-tldr-commute-handoff.txt` after the drive.
Do not ask Brad to troubleshoot while driving.

## Privacy Rules

- Never include a full Voice transcript or raw audio.
- Never include credentials, raw Gmail body text, or sensitive personal detail.
- For a Range-related note, store only a sanitized description with
  `destination: "range_review"`.
- Do not promote any note into the public wiki automatically.
