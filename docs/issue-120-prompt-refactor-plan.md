# Issue 120: Minimal Commute Prompt Refactor Plan

Status: planning handoff only; no prompt, schema, or live Project changes.
Recorded September 2, 2026, America/New_York, for resumption tomorrow night.
Issue: [#120](https://github.com/Brad-Balfour/llm-wiki/issues/120).
Branch: `agent/issue-120-prompt-plan`.
Worktree: `repo/worktrees/issue-120-prompt-plan`.

## Objective and hypothesis

Reduce the `LLM-Wiki-Car` Project instructions to the unusual requirements of
reading a queue to Brad. Move capture/export instructions into an attached
`session-export.md` in the same Project. Do not design a miniature Codex agent
inside an ordinary iPhone Voice conversation.

Brad's hypothesis is that the large Project prompt causes GPT-Live to forget
instructions almost immediately. The current revision 4.1 is approximately
1,161 words / 7,947 bytes. Prompt size and competing instructions are plausible
contributors, not established causes. Repeated instructions, per-command queue
reloads, and v3's pre-rendered playback field have not eliminated substitutions.
September 2's four strict-valid recovered bundles still accompanied incorrect
live playback. Bundle validity does not prove what the driver heard.

This is a substantive reduction experiment, not another accumulation of wording
for every historical failure. There is no agreed minimum word count; the
assistant's earlier 400–600-word target was dropped.

## Agreed design

### Main Project instructions

Keep only concise, task-specific guidance:

- Select the requested canonical queue from the existing Project Library.
- Read its complete literal `sweep_playback` before detailed playback.
- Read the selected item's literal `playback_text` for queue playback.
- When navigating or returning to playback after discussion, re-read the active
  queue JSON file from the Project Library, then read the selected item's
  literal `playback_text`. This is Brad's explicit addition, not merely an
  instruction to recall previously loaded text. Do not silently switch queues.
- Keep only essential playback behavior such as waiting after an item; do not
  teach ordinary conversation, enumerate navigation synonyms, or script article
  discussion. If a source-grounding sentence is necessary, name the current
  item's exact URL without permission/approval language.
- Use one tiny reference sentence for captures and ending, provisionally:
  `For commute captures and end-of-commute export, follow session-export.md.`

Do not retain the main-prompt warning about never claiming success without a
download. Brad already checks the chat for a real link and reprompts. Do not
add a special case for the isolated August 24 interpretation of “finish.”
Deduplicate rules instead of preserving every historical example or exception.

Re-reading the file is the requested behavior, not a claim that a prompt can
force a retrieval on every turn. Keep any necessary grounding-failure response
short. Reconcile existing specification conflicts before implementation rather
than hiding them under the label of a wording-only change.

### Attached session-export.md

Move capture interpretation and export mechanics here: supported saves and
corrections, user wording, queue/item association, JSON structure, canonical
snapshot, filename/time requirements, integrity, unresolved evidence, event
reconstruction, and artifact creation. Reference the existing bundle schema
instead of duplicating it unnecessarily. Do not change the bundle contract just
to shorten the main prompt.

The conversation is the available evidence until export. “Wiki this” and its
surrounding context can support a later bundle; an acknowledgment is not a
durable write. There is no demonstrated separate append-only event store or
filesystem being updated during this iPhone Voice workflow. Do not resurrect
the failed ledger, promise silent persistence, or imply that “remember exact
events” supplies a storage mechanism.

At export, use available conversation evidence and the canonical queue.
Missing context remains missing; do not fabricate item binding, user intent,
visits, or a complete event history. Move the necessary evidence rules out of
the main prompt rather than claiming they must remain there for live writes.
The reference file must be usable without having been loaded at session start.

### Platform boundary

Keep the existing standalone iPhone ChatGPT Project workflow. Treat the attached
Markdown as a Project reference, not an installed skill. Assume no native
Codex/Work-style skill mechanism in this workflow unless direct evidence proves
otherwise. Do not add skill installation, filesystem writes, tools, hooks, or a
custom Voice client to this issue.

The official [Voice documentation](https://learn.chatgpt.com/docs/features/voice)
describes desktop Voice and desktop-host-paired iOS access; it does not establish
the same capabilities for Brad's standalone iPhone Project conversation. The
earlier [Realtime guidance](https://developers.openai.com/api/docs/guides/realtime-models-prompting)
is useful design background, not proof of the model or controls exposed here.
“Project files are only RAG” is not a verified description of internal context
handling. Reliable retrieval and following of `session-export.md` remain an
explicit live acceptance question.

## Excluded changes and rejected proposals

- Opaque/product-name-only headlines such as Wigolo, GlassBox, and Mole belong
  to classifier and queue-JSON generation work, not #120. Brad agrees these are
  upstream concerns. Do not add Voice-side explanatory text to literal playback.
- Missing author/publication attribution should be fixed upstream in queue
  generation. Brad prefers populated metadata to a Voice-side null fallback.
  Source-grounded values, not invented non-null placeholders, are required;
  unresolved-source handling belongs to that separate work.
- No new permission model for conversation or article retrieval.
- No extensive navigation grammar, simulated live ledger, special “finish”
  disambiguation rule, or main-prompt download-success warning.
- No classifier/profile/routing changes, schema migration, historical cleanup,
  queue regeneration, artifact deletion, or automated phone harness here.
- No immediate A/B exercise or repeated manual prompt swaps. No reminder or
  scheduled task was requested.

## Required evidence review when resuming

This document preserves the decisions from the conversation. The complete
cross-issue evidence review is still pending; do not represent it as finished.
Yes, rereading the log and all relevant issue evidence is part of planning,
before drafting the implementation—not an optional afterthought.

1. Read `AGENTS.md` and inspect the branch/worktree status. Resume in this
   worktree with Brad's request; leave the primary checkout and other worktrees
   alone. Check whether main has advanced before deciding how to update this
   branch.
2. Read the complete `docs/commute-experiment-log.md`, including the failed
   ledger/capture history and the July–September progression. Distinguish
   contemporary evidence from superseded prompts and validator behavior.
3. Re-read #120's body and every comment. Follow all directly related issue
   evidence, including closed issues and linked PRs where they establish an
   experiment or design decision. Start with #100 and #106 for grounding/literal
   playback, then discover the exact capture, ledger, export, and Library issues
   from the log and their cross-links. Read #35/#66/#68 for the upstream boundary
   without expanding this issue into classifier work. Do not assume this seed
   list exhausts the relevant issues.
4. Read `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`, its source README, both
   queue/bundle schemas, and `tests/project-prompt.test.ts`. Inspect relevant
   generation and bundle tests to understand contracts, not to broaden scope.
5. Read both active OpenSpec changes, especially the operating-loop compatibility
   map and queue-selection, voice-session, and session-bundle requirements.
   The operating-loop change governs conflicts with the bootstrap change.
   Inspect the discrepancy between older terminal/no-retrieval requirements and
   the active prompt's recovery behavior before adding explicit file rereads.
6. Consult official prompting guidance for this exact surface where available.
   Do not substitute Realtime API, desktop Work, or Codex capabilities for
   standalone iPhone Voice. Keep any uncertainty explicit.
7. Add a compact evidence-to-decision summary here: what moves, what is deleted,
   what remains, and any genuine conflict requiring Brad's decision. Do not
   translate every incident into a new instruction.

If GitHub access/authentication fails inside the sandbox, retry with host
escalation before reporting invalid authentication.

## Implementation sequence after the evidence review

1. Draft the minimal main prompt and `chatgpt-project/session-export.md` together.
   Review against the agreed scope above, particularly literal playback after
   an actual queue-file reread and the absence of a fictional live event store.
2. Update focused prompt tests to check the new split and essential contract.
   Remove obsolete assertions that force export wording into the main prompt;
   do not delete substantive evidence safeguards from the exporter contract.
3. Align any touched OpenSpec requirements and update the Project source README
   with the exact new upload and candidate prompt revision. Preserve the current
   deployed revision until Brad confirms the actual manual change.
4. Run focused tests, then `npm run check` and strict OpenSpec validation for
   touched changes as required by `AGENTS.md`. Deterministic tests can establish
   schema/text/reference correctness, not actual Voice adherence.
5. Commit the implementation, publish a focused PR when requested, and obtain
   the one latest-complete-head review required for behavior changes. Do not
   merge or deploy without authorization.
6. Supply the exact copyable Project instructions and name the exact file to
   upload: `chatgpt-project/session-export.md` into `LLM-Wiki-Car`. Both remain
   in that same Project. Include rollback instructions and do not claim the
   change is live until Brad confirms the paste/upload.

## Testing and time constraints

Tonight is plan-only because Brad reported roughly 9% usage remaining. Resume
planning/implementation tomorrow night; defer controlled phone testing until
Brad has time over the three-day weekend. Do not make an immediate test session
a prerequisite for saving this plan or preparing the implementation.

Prompt versions must be manually swapped in the Project. Previously consumed
Library queues have been deleted through the completed-commute cleanup process;
do not assume they remain available for replay. Before later testing, inventory
any retained private canonical evidence and agree on a small reusable queue or
newly generated fixture. Never assume an exported reconstruction is an original
queue, publish private artifacts, restore uploads, or change retention policy
without an appropriate request.

For a later controlled test, hold queue, device, and spoken sequence constant
where practical. Cover the opening sweep, normal reading, a discussion followed
by navigation/file reread, captures, an interruption, and export-reference use.
Score literal fidelity, queue identity, sweep completion, capture correctness,
and first-attempt export separately. Observe actual iPhone Voice; a text-only
test or valid recovered bundle is not an audio acceptance result. No claim of
automated mirroring, simulator audio, or faster-than-real-time tests is supported.

Ordinary use after a single deployment may provide useful observations without
manual version swapping, but cannot establish prompt length as the cause.

## Resume handoff

Next action: complete the evidence review above, then draft the two-file split.
This planning commit changes only this document. It does not close #120, change
the live Project, or require a Project upload tonight.
