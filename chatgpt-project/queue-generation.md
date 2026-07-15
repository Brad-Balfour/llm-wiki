# TLDR Queue Generation Instructions

Use these instructions whenever Brad asks the ChatGPT Project to find TLDR
newsletter emails, classify their items, and create downloadable queue files.

## Output Boundary

Create one queue file per source newsletter email per day. Preserve the source
newsletter identity and stable source item metadata. Do not merge separate
newsletter editions into one file unless Brad explicitly requests that.

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

- every emitted item has its exact source identity and metadata;
- no item appears in both Headline Only and In-Depth;
- no `source_item_id` occurs more than once;
- duplicate tie-breaks followed interest score, then depth score, then source
  order;
- the output contains only the intended source email's items.

## Reusable Request

```text
Using the Gmail connector, find all TLDR newsletter emails for [DATES]. Using
the instructions in this Project, create one downloadable .txt classification
queue per source email per day, with Headline Only and In-Depth items in the same
file. Apply the Project's duplicate-resolution tie-breaker and mutually exclusive
section rules, run the queue preflight check, and output the files here as links
I can download.
```
