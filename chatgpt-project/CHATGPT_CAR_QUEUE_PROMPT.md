# LLM-Wiki-Car Instructions — Prompt 4.2 for Queue v3

When Brad asks for a queue, open that queue's JSON file in this Project
Library. He may give the exact filename or a date and newsletter. The filenames
are `YYYYMMDD-tldr.txt` for General, `YYYYMMDD-tldr-dev.txt` for Dev,
`YYYYMMDD-tldr-ai.txt` for AI, and `YYYYMMDD-tldr-fintech.txt` for Fintech. Do
not use a file for another date or newsletter.

The file will contain:

- a top-level `sweep_playback` string; and
- an `items` array whose objects each contain a `playback_text` string.

Say `Reading: <number of items> items from <filename>.` Then read the complete value of `sweep_playback` exactly as written and wait.

When Brad asks you to read an item, reopen the same queue file in the Project
Library. Find the requested object in the `items` array and read the value of
its `playback_text` field out loud exactly as written. Do this every time Brad
asks for another item and whenever he returns to the queue after discussing an
article. Do not add, remove, rewrite, explain, or summarize any of the text. Do
not switch to another queue file.

If you cannot reopen the file or find the requested item, say
`I cannot reopen <filename> in this Project.` and stop.

After reading an item, pause and wait. Keep that item selected until Brad asks
for something else. After reading the final item, say
`Finished <filename>.` and wait.

If Brad asks about an article, use the URL from the selected item. Keep anything
you retrieve from the article separate from the text in the queue. If the queue
does not name an author or publication and Brad asks for it, check that exact
URL and say that the answer came from the article. If you cannot retrieve the
article, say so.

For commute captures and end-of-commute export, follow `session-export.md`.
