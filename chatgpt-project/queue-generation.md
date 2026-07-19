# TLDR Queue Generation Instructions

Use these instructions whenever Brad asks the ChatGPT Project to find TLDR
newsletter emails, classify their items, and create downloadable queue files.

## Output Boundary

Create one queue file per source newsletter email per day. Preserve the source
newsletter identity and stable source item metadata. Do not merge separate
newsletter editions into one file unless Brad explicitly requests that.

## Date-Parameterized Requests

Treat the request date as an email-delivery filter, not a filename value. For
each emitted queue, derive its leading `YYYYMMDD` from that source email's own
delivery calendar date in `America/New_York`, never from the date ChatGPT runs.

Brad can use this short request in any new text chat in the LLM-Wiki-Car Project:

```text
Generate TLDR queues for emails delivered on 2026-07-17.
```

For catch-up work, replace the date with a date range, for example:

```text
Generate TLDR queues for emails delivered from 2026-07-17 through 2026-07-19.
```

The weekday scheduled Task is simply the same workflow with “delivered today”
as its filter. The date rule above still controls every filename.

Every queue file is a UTF-8 JSON object conforming to
`schema/tldr-commute-queue-v1.schema.json`:

- `queue_version` is exactly `tldr-commute-queue.v1`.
- `newsletter`, `edition_date`, and `source_email` identify the one source
  newsletter email.
- `headline_only` then `in_depth` are the playback order. An item appears in
  exactly one of those arrays.
- Every item preserves the exact `source_item_id`, title, summary, final HTTP(S)
  URL, classifier facts, and routing metadata required by the schema.

The queue contains sanitized editorial metadata only. Never include raw Gmail
bodies, headers beyond the required source identity, credentials, cookies,
private notes, or Range material. Do not add fields outside the schema.

## Duplicate Resolution

Before writing each queue file, detect duplicate candidates within that file by:

1. identical `source_item_id`;
2. otherwise, identical normalized final article URL;
3. otherwise, identical normalized title.

A duplicate may originate in the newsletter or be introduced during extraction
or classification. Include the article only once.

Keep the candidate with the highest `interest_score`. If tied, keep the candidate
with the highest `depth_score`. If still tied, keep the earliest occurrence in
the source newsletter. Use the surviving candidate's final `consumption_depth`
to select its section.

Headline Only and In-Depth are mutually exclusive sections. A surviving item
must appear in exactly one section and its `source_item_id` must not occur twice
in the output file. Preserve genuine repeated articles in different newsletter
editions as separate source instances in their respective files.

## Preflight Check

Before creating the downloadable file, verify:

- the object matches `tldr-commute-queue.v1` and contains only schema fields;
- every emitted item has its exact source identity and metadata;
- no item appears in both Headline Only and In-Depth;
- no `source_item_id` occurs more than once;
- duplicate tie-breaks followed interest score, then depth score, then source
  order;
- the output contains only the intended source email's items.

The production scheduled Task prompt is versioned in
`chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT.md`. Keep the Task prompt and
these instructions aligned; changing a repository file does not remotely change
the Task.

## Reusable Request

```text
Using the Gmail connector, find all TLDR newsletter emails for [DATES]. Using
the instructions in this Project, create one downloadable .txt classification
queue per source email per day, with Headline Only and In-Depth items in the same
file. Apply the Project's duplicate-resolution tie-breaker and mutually exclusive
section rules, run the queue preflight check, and output the files here as links
I can download.
```
