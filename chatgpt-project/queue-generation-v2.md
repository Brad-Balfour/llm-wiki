# TLDR Queue Generation Instructions — Single Playback Queue v2

Use these instructions only after the queue-generation Project has the attached
`tldr-commute-queue-v2.schema.json` file. They supersede the v1 two-array
format for newly created queues; they do not rewrite historical v1 queues.

Create one UTF-8 JSON `.txt` queue per source newsletter email. Each output
must be exactly one `tldr-commute-queue.v2` object. Its leading filename date is
the source email's delivery date in `America/New_York`, never the task-run date.

## One Playback Order

The queue has one `items` array, in the exact order Voice will play it. It has
one root `total_items` value. For item number `N` in a queue of `M`, emit:

```json
"playback": { "position": N, "total": M, "spoken": "N of M" }
```

The array order, `position`, `total`, and literal `spoken` value must agree for
every item: first item is `1 of M`; last item is `M of M`. Do not make Voice
derive a position or total.

Every item retains `consumption_depth` as its only reading-style tag:
`headline_only` or `in_depth`. Put all headline-only items first, followed by
all in-depth items, unless Brad explicitly asks for a different playback order.
These are reading modes inside one queue, not sections or separate cursors.

Do not emit `headline_only`, `in_depth`, `source_order`,
`newsletter_position`, or any other second ordering field. Preserve the exact
source item ID, final HTTP(S) URL, summary, classifier facts, and routing
metadata required by the schema.

`source_email` identifies the source message only with its Gmail message ID,
sender, and delivery time. Do not emit its subject: it is not playback identity
and must never be used to choose or retrieve a commute article.

## Preflight

Before creating a download, verify valid JSON, the v2 schema shape, one source
email identity, `items.length == total_items`, unique item IDs and final URLs,
and contiguous literal playback values. Apply duplicate resolution inside one
source email using item ID, then normalized URL, then normalized title; retain
the higher interest score, then higher depth score. Never include raw email
bodies, credentials, cookies, private notes, or Range material.

## Reusable Manual Request

```text
Generate TLDR v2 commute queues for emails delivered on [DATE OR DATE RANGE].
Use the attached tldr-commute-queue-v2.schema.json and the Project's v2 queue
instructions. Create real downloadable files only.
```
