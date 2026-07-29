# Weekday TLDR Queue Task Prompt — v2 Live

> Live configuration verified 2026-07-26. The managed body below exactly
> matches the active **Weekday TLDR Queues** Task. The Task is scheduled Monday
> through Friday at 11:00 AM. July 21-24 and July 28 runs found the expected
> Gmail messages but failed at scheduled artifact generation; see
> `docs/live-workflow-audit-2026-07-26.md` and
> `docs/commute-experiment-log.md`.

```text
Using the Gmail connector, find all TLDR newsletter emails delivered on the day
this task runs. Using the LLM-Wiki-Car Project's v2 queue instructions and the
attached tldr-commute-queue-v2.schema.json, create one real downloadable .txt
classification queue per source email.

Each file must be one valid tldr-commute-queue.v2 JSON object with one ordered
items array and total_items. Every item must contain playback.position,
playback.total, and playback.spoken in literal contiguous form: 1 of M through
M of M. Use consumption_depth only as the headline_only or in_depth reading
style tag. Do not emit separate headline_only or in_depth arrays, source_order,
any newsletter-position field, or a source-email subject. Preserve exact
source_item_id, title, summary, final HTTP(S) URL, and all schema-required
classifier and routing metadata.

Apply the Project duplicate-resolution tie-breaker and perform this self-check:
valid JSON, v2 schema shape, one source-email identity, items.length equals
total_items, contiguous playback values, unique item IDs and URLs, and no raw
email bodies, credentials, cookies, private notes, or Range material. Filename
dates use the source email's own America/New_York delivery date as YYYYMMDD,
never the task execution date. Provide each queue as a real downloadable
artifact and link it here. Do not use Google Drive, external storage, folders,
placeholders, or a separate archive/persistence step. If a queue cannot be
created, say so and do not report it as successful. This self-check is not a
claim of deterministic validation: the downloaded artifact is accepted only
after the local `npm run validate:commute-queue -- <queue.txt>` command passes.
```

The generated object follows this shape. The example is illustrative; emit all
schema-required classifier and routing fields for every real item.

```json
{
  "queue_version": "tldr-commute-queue.v2",
  "newsletter": "TLDR",
  "edition_date": "2026-07-16",
  "source_email": {
    "gmail_message_id": "example-message-id",
    "sender": "TLDR <dan@tldrnewsletter.com>",
    "delivered_at": "2026-07-16T07:05:43-04:00"
  },
  "total_items": 2,
  "items": [
    {
      "playback": { "position": 1, "total": 2, "spoken": "1 of 2" },
      "source_item_id": "example-message-id-01",
      "title": "First exact article title",
      "summary": "A concise queue summary.",
      "url": "https://example.com/first",
      "interest_level": "interested",
      "interest_score": 0.85,
      "consumption_depth": "headline_only",
      "depth_score": 0.35,
      "commute_behavior": "quick_read",
      "signals": ["example"],
      "reason": "Example classifier rationale.",
      "profile_version": "example",
      "prompt_version": "example",
      "provider": "example",
      "model": "example",
      "parser_version": "example",
      "route_version": "example",
      "classified_at": "2026-07-16T11:00:00-04:00",
      "routed_at": "2026-07-16T11:00:00-04:00"
    },
    {
      "playback": { "position": 2, "total": 2, "spoken": "2 of 2" },
      "source_item_id": "example-message-id-02",
      "title": "Second exact article title",
      "summary": "A concise queue summary.",
      "url": "https://example.com/second",
      "interest_level": "maybe",
      "interest_score": 0.67,
      "consumption_depth": "in_depth",
      "depth_score": 0.82,
      "commute_behavior": "discuss",
      "signals": ["example"],
      "reason": "Example classifier rationale.",
      "profile_version": "example",
      "prompt_version": "example",
      "provider": "example",
      "model": "example",
      "parser_version": "example",
      "route_version": "example",
      "classified_at": "2026-07-16T11:00:00-04:00",
      "routed_at": "2026-07-16T11:00:00-04:00"
    }
  ]
}
```
