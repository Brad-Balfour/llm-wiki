---
name: process-daily-commute
description: Process Brad's recurring daily commute intake end to end. Use when Brad supplies dated TLDR commute queues, commute session bundles, shared-chat URLs, or shorthand such as "today's commute," and expects validation, bounded reconciliation, durable project memory, open-issue updates, workflow improvements, publication, PR review, and a complete handoff.
---

# Process Daily Commute

Treat the commute as a recurring evidence and improvement loop, not a one-off
file review. Read the `Recurring daily commute processing` section of
`AGENTS.md` first; it is the authoritative policy. Use this skill for execution
order and completion checks.

## Intake and reconcile

1. Inventory every supplied queue, bundle, and shared-chat URL. Deduplicate
   repeated URLs without dropping distinct files or sessions.
2. Read the active commute prompt, bundle schema and validator, relevant
   OpenSpec change, and the recent experiment-log entries before interpreting
   new evidence.
3. Validate each canonical queue and each bundle independently. Compare the
   embedded queue snapshot byte-for-semantic-field with the separately supplied
   queue. Use shared chats only as bounded recovery evidence.
4. Preserve normalized private intake under `.private/`; never commit it. Do not
   invent item identity, user intent, intermediate playback, wiki saves, or
   classifier labels.
5. Reconcile evidence into the repository's established channels: maintenance
   candidates, exact classifier feedback, quality incidents, general captures,
   duplicate/prior-awareness evidence, and unresolved evidence.

Brad's words are natural-language intent, not a command grammar. Standardized
enum values and schema terms are internal artifact vocabulary only. Interpret
clear synonyms, paraphrases, positions such as “N of M,” and unambiguous item
references against the verified active queue. Ask a short neutral clarification
only when the intended action or target genuinely cannot be determined.

## Curate durable learning

1. Add sanitized, evidence-backed findings to the experiment log or other
   canonical tracked memory.
2. Search open issues before creating a new destination. Add material recurring
   evidence to the matching issue in the same run, including date, artifact
   identities, observed behavior, boundary, and PR link. Avoid duplicate
   comments.
3. Treat mistakes and friction in this processing run as evidence. Add the
   smallest durable prompt, instruction, specification, schema, test, or
   automation change that prevents recurrence.
4. Distinguish observed product defects from normal user behavior and from
   contract gaps. Correct stale or inaccurate issue/PR comments instead of
   allowing contradictory durable memory to remain.

## Verify and publish

1. Before treating repository edits as the whole deliverable, compare the diff
   with the live Project instructions and source list in
   `chatgpt-project/README.md`. Any changed live prompt or Project source creates
   a required live-sync action; never leave Brad to infer it from the diff.
2. When a live-sync action exists, immediately provide the exact merged or
   merge-ready prompt in one copyable block, or list the exact source files and
   destination. Do this without waiting for Brad to request it. Repository and
   GitHub writes do not authorize changing the live Project UI, so keep the
   action explicitly unresolved until Brad confirms it was applied. Then update
   the repository's live-version record in the active PR or a focused follow-up.
3. Run focused tests while iterating, then run `npm run check`, strict validation
   for every touched OpenSpec change, and `git diff --check`.
4. Commit only the intended tracked files, push the branch to `origin`, and open
   or update a draft PR. Never stop at a local commit.
5. Keep the PR body current with user impact, root cause, evidence counts,
   validation, and the latest head commit. Cross-link relevant issues.
6. Inspect all review threads. Fix actionable comments, reply with the commit and
   validation evidence, resolve the thread, and request a fresh Codex review of
   the new head when the fix materially changes behavior.
7. Wait for the latest-head CI checks and required review workflows. Merge only
   with explicit user authorization and only when checks and actionable review
   threads are clean.

## Completion

Report the remote branch, commit, PR, CI/review state, issue updates, evidence
counts, and any genuinely unresolved item. Do not call the daily loop complete
or merge-ready while a required live-sync action is unconfirmed. For every
changed live prompt, return the exact file contents in one copyable block before
handoff; never reconstruct them from memory and never make Brad remember to ask.
