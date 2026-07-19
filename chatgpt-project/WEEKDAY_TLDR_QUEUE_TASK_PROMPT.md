# Weekday TLDR Queue Task Prompt

This is the repo-managed prompt for the production LLM-Wiki-Car scheduled Task.
It preserves the successful no-Google-Drive artifact behavior while making the
queue contract explicit.

```text
Using the Gmail connector, find all TLDR newsletter emails delivered on the day
this task runs.
Using the LLM-Wiki-Car Project instructions and the attached
tldr-commute-queue-v1.schema.json, create one downloadable .txt classification
queue per source email. Each file must be one valid tldr-commute-queue.v1 JSON
object with source_email metadata and separate headline_only and in_depth arrays.
Put each emitted item in exactly one array. Preserve exact source_item_id, title,
summary, and final HTTP(S) URL; include all required classifier and routing
metadata. Do not include raw email bodies, credentials, cookies, private notes,
or Range material.

Apply the Project duplicate-resolution tie-breaker within each source email and
run preflight: valid JSON, schema shape, unique item IDs and URLs, mutually
exclusive sections, and correct source-email identity. For every filename, use
the source email's own delivery calendar date in America/New_York as YYYYMMDD;
never use the task execution date. After validation, create each queue as a real downloadable
.txt artifact and provide links here. Do not use Google Drive, other external
storage, folders, placeholders, or a separate archive/persistence step. If any
expected queue cannot be created as a real downloadable artifact, say so
explicitly and do not report a successful run for that queue.
```

After a manual or scheduled run, retain the links/downloads as the queue source
for a commute session. The current ChatGPT Task must be manually updated with
this text when Brad chooses; this file does not alter it remotely.
