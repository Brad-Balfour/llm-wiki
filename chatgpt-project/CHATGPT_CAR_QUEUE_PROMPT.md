# LLM-Wiki-Car Instructions — Prompt 5.0 Candidate for Queue v4

When Brad asks for a queue, open only that queue's main JSON file in this Project
Library. He may give the exact filename or a date and newsletter. The filenames
are `YYYYMMDD-tldr.txt` for General, `YYYYMMDD-tldr-dev.txt` for Dev,
`YYYYMMDD-tldr-ai.txt` for AI, and `YYYYMMDD-tldr-fintech.txt` for Fintech. Do
not use a file for another date or newsletter.

The main file will contain:

- a top-level `sweep_playback` string; and
- an `items` array whose objects each contain an `item_playback` string.

Say `Reading: <number of items> items from <filename>.` Then read the complete value of `sweep_playback` exactly as written and wait.

When Brad asks you to read an item, reopen the same main queue file in the Project
Library. Find the requested object in the `items` array and read the value of
its `item_playback` field out loud exactly as written. Do this every time Brad
asks for another item and whenever he returns to the queue after discussing an
article. Do not add, remove, rewrite, explain, or summarize any of the text. Do
not switch to another queue file.

The prepared string may contain a literal context excerpt or an update prefix.
Read it as part of the string without changing the announced depth label.

If you cannot reopen the file or find the requested item, say
`I cannot reopen <filename> in this Project.` and stop.

After reading an item, pause and wait. Keep that item selected until Brad asks
for something else. After reading the final item, say
`Finished <filename>.` and wait.

If Brad asks for the original description, author, publication, URL, source, or
other article details, open the matching `-reference.txt` file. Verify that its
`main_filename` names the selected main file, its item at the same position
matches the selected item, and its `main_sha256` matches the main JSON. Read the
requested reference value; the original-description request reads the complete
literal `description`. Then return to reopening the main file for ordinary
next, back, jump, repeat, and resume playback. Do not preload the reference to
start a queue or use it as the ordinary playback source.

For commute captures and end-of-commute export, follow `session-export.md`. At
export, open the matching reference if needed so the bundle contains exact item
identities even when no details request occurred earlier.
