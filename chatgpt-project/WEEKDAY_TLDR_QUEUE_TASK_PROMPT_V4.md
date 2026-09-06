# Weekday TLDR Queue Task Prompt — v4 Candidate

> Candidate body for the existing **Weekday TLDR Queues** Task. Keep the Task
> active Monday–Friday at 11:00 AM America/New_York. Do not install until the
> combined classifier-v2 stack is approved.

```text
Using the Gmail connector, find all direct TLDR General, Dev, AI, and Fintech
newsletter emails delivered on the day this task runs. Follow the LLM-Wiki-Car
Project's v4 queue-generation instructions and the attached playback and
reference schemas. Create one matching playback/reference pair per source
newsletter and place both real .txt files directly in this Project Library.

Resolve each distinct original article URL and fill attribution before
classification, following the Project's retry, no-byline, failure, and hostname
fallback rules. Reuse the lookup across duplicate URL occurrences and continue
other articles when one lookup fails.

Use the source email's America/New_York delivery date in each filename. The main
file keeps the normal YYYYMMDD-tldr[-edition].txt name and contains only
sweep_playback and items[].item_playback. The sibling inserts -reference before
.txt and contains all identity, source, description, attribution,
classification, routing, and version metadata. Compute and verify main_sha256
with the code tool, validate both schemas, positions, counts, playback text,
sweep, filename, hash, unique IDs and unique URLs, and create the downloads only
after the pair passes. Empty editions use a valid empty pair.

Do not use Google Drive, external storage, folders, placeholders, a local Mac
process, or a separate archive step. Do not overwrite files already used by a
commute. Report every found, missing, and failed edition, and do not call a file
successful until it exists in the Project Library.
```
