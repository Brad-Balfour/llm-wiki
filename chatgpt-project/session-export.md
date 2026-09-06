# Save Commute Notes and Create the Session Bundle

Use this file when Brad asks to save or correct something during a commute, or
when he asks to end the commute and create the bundle. Create the bundle as JSON
using the attached `commute-session-bundle-v1.schema.json` file.

## During the commute

The chat is the only record available until you create the bundle. Saying that
something was saved does not write it to a file. Do not claim that you maintain
a separate ledger or write events to one during the commute.

Use Brad's words to decide what to record:

- If he asks to add or save the current article to the wiki, record an
  `item_action` whose `action` is `wiki_this`.
- If he clearly changes the current article's interest or depth, use
  `mark_interested`, `mark_uninterested`, or `promote_to_in_depth`. Skipping an
  article is not classifier feedback.
- If he reports a playback or product problem, record a `quality_incident`.
- If he makes a note that is not about an article, record a `general_capture`.

For a v4 article event, copy `source_item_id`, `title`, and `url` from the item
at the current position in the matching reference file. For v2/v3, copy them
from the current queue object. Copy Brad's exact words into `user_words`. Only connect an
event to an article when the chat shows that article was current at the time.
If the article or request is unclear, create an `unresolved_capture` with
Brad's words and whatever clues are available. Do not guess the article, his
intent, or events that are missing from the chat.

Reply briefly when Brad records something, then leave the current article
selected.

## When Brad ends the commute

When Brad clearly asks to end the commute or create the bundle, reopen the same
main queue file in the Project Library. For v4, also open and verify the matching
reference file. Put both complete objects in `queue_snapshot.queue` as
`{ "queue_version": "tldr-commute-queue.v4", "playback_file": <main>,
"reference_file": <reference> }`. Keep the main filename in
`queue_snapshot.filename`. For v2/v3, keep putting the complete single queue
object in `queue_snapshot.queue`.

If either exact v4 file cannot be found, or the pair does not match, stop with an
explicit export failure. For v2/v3 recovery, another filename may be used only
if exactly one valid file has the original date and newsletter. Do not use a
remembered queue or one with a similar topic.

Create one JSON object that passes `commute-session-bundle-v1.schema.json`. The
object will include:

- `schema_version` and the required session fields;
- the complete queue file;
- the final playback state;
- the integrity fields; and
- every note, correction, reported problem, and unresolved request supported by
  the chat.

Record only articles that were actually read, in the order shown by the chat.
The first `item_announced` may be any object in the queue. A
`playback_transition` names the article that Brad was leaving; the next
`item_announced` names the article he moved to. Do not invent missing moves,
announcements, or articles between them.

If the chat clearly shows a later article but not how Brad moved to it, keep the
later `item_announced`. Explain the missing step in
`integrity.incomplete_reason` and set `integrity.state` to `partial` or
`recovered`. `playback.status` may be `completed` when Brad ended the commute;
it does not mean that every article was read. If the bundle includes a final
cursor, it must point to the last article that the chat shows was current.

For each event, say where the information came from:

- Use `selected_queue_snapshot` for fields copied from the queue.
- Use `explicit_user_capture` for Brad's direct words.
- Use `user_provided_chat_or_ui_observation` for events rebuilt from the visible
  chat.
- Use `durable_contemporaneous_record` only when a real separate record exists
  and covers the listed events.

Normally set `integrity.state` to `partial`, because the chat is not a separate
event file. Use `recovered` if you had to find the queue again or rebuild the
event order while creating the bundle. Use `complete` only when a real separate
record covers every event and the bundle includes the record details required
by the schema. Leave missing or conflicting information unresolved. Do not fill
gaps by guessing.

Use the actual time in America/New_York. Set `session.session_date` from that
time and name the file:

```text
YYYYMMDDHHmm-morning-commute-session-bundle.txt
YYYYMMDDHHmm-evening-commute-session-bundle.txt
```

Use `morning` before noon and `evening` at or after noon. Put the same name in
`session.artifact_filename`. A numeric suffix added by the Library is okay.

Create a downloadable `.txt` file containing the JSON. Say it is ready only
after the file is available. If you cannot find one matching queue or create a
downloadable file, say
`session export failed: no downloadable bundle was created`.
