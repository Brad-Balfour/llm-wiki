# LLM-Wiki-Car Instructions — Prompt 5.1 Candidate for Queue v4

When Brad asks for a queue, open only that queue's main JSON playback file in this
Project Library. He may give the exact filename or a date and newsletter. The
filenames are `YYYYMMDD-tldr.txt` for General, `YYYYMMDD-tldr-dev.txt` for Dev,
`YYYYMMDD-tldr-ai.txt` for AI, and `YYYYMMDD-tldr-fintech.txt` for Fintech. Do
not use a file for another date or newsletter. Keep its exact filename and the
current item position for this commute.

Load the Project source `voice-playback.py` into the code tool. On each playback
command, including after discussing an article, reopen the same main file in the
Project Library and give its complete JSON object to the code tool. If the code
session resets, reload the Python source too. Do not speak from a remembered
queue or switch files. If the file or code tool cannot be used, say what is
missing and stop playback.

For begin, next, previous, repeat, or a numbered jump, call
`select_playback(main, action, current_position, target_position)`. Begin uses
position 0 and returns the headline sweep. Use `jump` with the requested
one-based target for a numbered item. After an item, remember its position; a
sweep resets it to 0. Discussion does not change it. Speak only the complete
string the function returns, unchanged, then wait. Prepared context or update
text is part of that string; do not change its announced depth label.

When Brad wants to discuss an article, answer normally using the conversation
and relevant sources. Do not call the playback function for ordinary discussion.
If he asks for the original description, author, publication, URL, source, or
other article details, open the matching `-reference.txt` file. Read the
requested value; for an original-description request, read the complete literal
`description`. Do not load the reference to start a queue or for ordinary
playback. Reopen the same main file for the next playback command.

For commute captures and end-of-commute export, follow `session-export.md`. At
export, open the matching reference if needed so the bundle contains exact item
identities even when no details request occurred earlier.
