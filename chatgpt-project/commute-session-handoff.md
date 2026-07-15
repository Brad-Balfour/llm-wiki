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

Follow `commute-session-ledger.md`. Append each explicit action and material
queue-state change to the structured internal ledger immediately. Do not wait
until the end of the session or reconstruct the ledger from conversational
memory.

Track only the attached queue filenames, explicit feedback and saved notes,
sanitized Range-related placeholders, queue progress and resume positions, and
material interruption, retrieval, preload, or speech-recognition problems. Do
not add casual conversation, inferred preferences, a full transcript, raw audio,
or notes Brad did not explicitly ask to save.

For every item-specific record, copy the exact `queue_file`, `source_item_id`,
title, and URL from the active queue. Never generate sequential IDs, replace
stable IDs, or use `unknown` as an article ID. Every `wiki_review` note MUST
include all four values; do not create a `wiki_review` note if any is missing.
A topic-level preference that is not tied to one queue item belongs in
`general_review` or `issues`, never `wiki_review`.

## Required Trigger Behavior

When the trigger phrase is spoken:

1. Stop reading or discussing the queue.
2. Say only: "Ending the commute session and creating the handoff."
3. Begin a fresh reconstruction pass. Reload every active queue file, this
   document, `commute-session-ledger.md`, `commute-handoff-v2.schema.json`, and
   the routing and approved-source rules when applicable.
4. Treat the queue files and structured ledger as the only sources of handoff
   field values. Conversational memory may locate those inputs but must not
   populate IDs, titles, URLs, filenames, actions, notes, or queue state.
5. If an authoritative input or required value is unavailable, do not guess,
   summarize from memory, or substitute an inferred value. Create no certified
   handoff until the authoritative value is reloaded.
6. Compile one `commute-handoff.v2` JSON object. Record the actual queue
   filenames, Voice surface, and one structured `queue_states` entry per queue.
   Use empty arrays for categories with no recorded items; do not invent missing
   details.
7. Save explicit feedback under `feedback`, explicit saved notes under
   `review_notes`, and material session problems under `issues`.
   - Every `feedback` item must identify the exact `queue_file`, one real
     `source_item_id`, and use only a
     schema-supported `action`: `mark_interested`, `mark_uninterested`,
     `promote_to_in_depth`, `save_for_review`, or `skip`.
   - Do not invent `type` fields in `feedback`.
   - Every `wiki_review` item must include `queue_file`, `source_item_id`,
     `title`, `url`, `note`, and `destination`. If the active item cannot be
     identified exactly, use `general_review` instead.
   - Put presentation, queue-state, retrieval, and general workflow observations
     in `issues` unless they are explicit review notes about a particular item.
8. Validate the complete object against the currently loaded
   `commute-handoff-v2.schema.json`. Validation must execute during this
   generation pass. Never describe an artifact as schema-valid merely because
   it looks correct or resembles an earlier valid object.
9. Create a new downloadable file. Use
   `YYYYMMDD-tldr-commute-handoff.txt` for the first artifact and append `-r2`,
   `-r3`, and so on before `.txt` for corrected attempts. Never overwrite or
   update an earlier artifact. Put only the validated JSON object in the file;
   do not wrap it in Markdown or add prose.
10. Treat every saved note as review-only. Do not publish, commit, send, create a
    reminder, or take any other external action.
11. Only after validation succeeds and the new file is created, say:
    "The commute handoff is ready."

If validation or file creation is unavailable, preserve the compiled JSON object
in the chat as an unvalidated draft and state that it must be validated and saved
after the drive. Do not say that the handoff is ready and do not ask Brad to
troubleshoot while driving.

## Minimal Valid Shape

Use this shape when one queue item was marked for wiki review. Replace every
example value with the exact active-session value; do not omit required fields.

```json
{
  "schema_version": "commute-handoff.v2",
  "session_id": "2026-07-13-evening-tldr",
  "session_date": "2026-07-13",
  "voice_surface": "chatgpt_standard",
  "queue_files": ["20260713-tldr-indepth.txt"],
  "queue_states": [
    {
      "queue_file": "20260713-tldr-indepth.txt",
      "status": "partial",
      "last_completed_source_item_id": "tldr_example_001",
      "resume_source_item_id": "tldr_example_002"
    }
  ],
  "feedback": [],
  "review_notes": [
    {
      "queue_file": "20260713-tldr-indepth.txt",
      "source_item_id": "tldr_example_001",
      "title": "Exact queue headline",
      "url": "https://example.com/article",
      "note": "Brad said: wiki this.",
      "destination": "wiki_review"
    }
  ],
  "issues": []
}
```

## Privacy Rules

- Never include a full Voice transcript or raw audio.
- Never include credentials, raw Gmail body text, or sensitive personal detail.
- For a Range-related note, store only a sanitized description with
  `destination: "range_review"`.
- Do not promote any note into the public wiki automatically.
