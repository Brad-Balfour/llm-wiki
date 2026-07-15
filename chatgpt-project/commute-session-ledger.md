# Commute Session Ledger

Maintain a structured, append-only internal ledger during every commute. Record
an event immediately when Brad gives a command or when material playback state
changes. Do not wait until the end of the session and do not reconstruct events
from conversational memory.

The ledger is transient working state used to compile the final handoff. Do not
read it aloud or include the raw ledger in the handoff.

## Authoritative Identity

For every item-specific event, copy these values from the active queue object:

- `queue_file`
- `source_item_id`
- `title`
- `url`

Never infer, normalize, renumber, or remember these values. If the active queue
object is unavailable, record a general event without article identity and do
not create an item-specific event.

## Event Types

Record only the minimum data needed for:

- `queue_started`
- `item_started`
- `item_completed`
- `partial_read`
- `resume_cursor`
- `wiki_review`
- `feedback`
- `skip`
- `save_for_review`
- `session_issue`

Each event includes an event type and monotonically increasing sequence number.
Item-specific events include the authoritative identity fields above. Preserve
Brad's explicit note when one was given; do not invent a reason or preference.

Use records shaped like:

```json
{
  "sequence": 12,
  "type": "wiki_review",
  "queue_file": "20260713-tldr-ai.txt",
  "source_item_id": "20260713-ai-004",
  "title": "Exact queue title",
  "url": "https://example.com/article",
  "note": "Brad said: wiki this."
}
```

For a general issue without article identity, use:

```json
{
  "sequence": 13,
  "type": "session_issue",
  "category": "preload_regression",
  "note": "The prefetched item was presented twice."
}
```

## Queue State

Maintain exactly one current state for each loaded queue:

- `not_started`
- `partial`
- `completed`

When a queue is partial, record the exact `resume_source_item_id`. Also record the
`last_completed_source_item_id` when known and `current_source_item_id` when an
article was interrupted partway through. Preloading an article never changes
queue state or the resume cursor.

## Compilation Boundary

At the end of the commute, compile the handoff from the authoritative queue
files plus this ledger. Conversational memory may locate those inputs but must
not populate handoff fields.
