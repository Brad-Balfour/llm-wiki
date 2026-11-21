# Save commute notes and export the handoff

When Brad ends the commute, create a downloadable `.txt` file containing one
JSON object that follows `commute-session-bundle-v2.schema.json`. The nightly
importer already has access to the selected queue. Send what Brad wanted to
keep and what went wrong during the commute.

## What to capture

Use the conversation to interpret Brad’s words. Include problems and requests
even when they came up during playback or navigation. Acknowledge a request briefly
and keep the current article selected. At export, collect the following events
in conversation order. Give each event its own `event_id`. Reuse the session
and event IDs if Brad asks to export the same commute again.

- For a wiki save, record an `item_action` with `action: "wiki_this"`, Brad’s
  exact words in `user_words`, and the article’s `source_item_id`. Attach a
  `discussion` to that save when the conversation supplies context worth
  keeping. Put the main point in `summary` and include `important_questions`,
  `conclusions`, or `requested_emphasis` when they add detail. Retain specific
  examples, caveats, and corrections that explain why Brad wanted the save. Keep Brad’s
  questions and hypotheses distinct from article claims. Omit absent fields.
- For explicit interest or depth feedback, use `mark_interested`,
  `mark_uninterested`, or `promote_to_in_depth`. An ordinary skip or a poor
  rating of the writing alone does not change interest or depth. Record
  `save_for_review` when Brad specifically asks to revisit an article.
- For a playback, export, or product problem, use `quality_incident`. Describe
  what happened in `observed_behavior` and when or where it happened in
  `boundary`. Include the detail that would let someone recognize it again.
- For other substantive observations or requests, use `general_capture` with
  Brad’s `user_words`. For an unclear request or uncertain article, use
  `unresolved_capture` with `capture_type`, `user_words`, and any known
  `recovery_clues`. Keep an explicit save even if its target remains uncertain.

## How to build the file

Set `schema_version` to `commute-session-bundle.v2`. Put the exact selected
main playback basename in `queue_filename`. For item actions, use the article
Brad identified, including a numbered item if he named one. If you need item
IDs, open the matching v4 `-reference.txt` file once, check its `main_filename`
and use its positions to look up just those IDs. For a single-file v2 or v3
queue, take `source_item_id` directly from its selected item. If the exact file or
identity is uncertain, retain the request as an `unresolved_capture`. A commute
with only general notes or problems needs no item lookup.

Set `session.session_id`, `session.voice_surface`, `session.session_date`, and
`session.artifact_filename`. Use the export date and time in America/New_York.
Before noon name the file `YYYYMMDDHHmm-morning-commute-session-bundle.txt`.
At or after noon use `YYYYMMDDHHmm-evening-commute-session-bundle.txt`. A
Library-added numeric suffix is acceptable.

Put the captures in `events`. Use `[]` when the session had nothing to save or
report. Leave article titles, URLs, descriptions, playback text, queue and
reference objects, navigation history and evidence arrays out of the file.
Check that it includes each requested save, its discussion, and each reported
problem. Say the file is ready only after the download exists. If you cannot
identify the selected queue or create the file, say
`session export failed: no downloadable bundle was created`.
