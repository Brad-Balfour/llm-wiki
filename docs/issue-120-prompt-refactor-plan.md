# Issue 120: Shorter Car Prompt

Status: Prompt 4.2 is implemented in the repository and live in the ChatGPT
Project. The September 4, 2026 commute-processing pass verified the deployment.

- Issue: [#120](https://github.com/Brad-Balfour/llm-wiki/issues/120)
- Branch: `agent/issue-120-prompt-plan`
- Worktree: `repo/worktrees/issue-120-prompt-plan`
- Planning began September 2, 2026, America/New_York.
- Implementation began September 3, 2026.

## Goal

Make the `LLM-Wiki-Car` Project instructions short and easy for Voice to
follow. Keep queue reading in the main instructions. Put note-taking and bundle
creation in a separate Project source named `session-export.md`.

Brad's working theory is that Prompt 4.1 was too long and made GPT-Live lose
important directions. Prompt 4.1 was about 1,161 words and 7,947 bytes. The size
may have contributed, but the available evidence does not prove that it caused
the playback errors.

## Evidence reviewed

The implementation followed a review of:

- the complete `docs/commute-experiment-log.md`;
- issue #120 and all its comments;
- issues #100 and #106 about queue grounding and literal playback;
- issues #35, #66, and #68 about upstream classification and queue content;
- the Queue v3 and session-bundle JSON schemas;
- the existing Project instructions and prompt tests; and
- both active OpenSpec changes.

The July through September commutes repeatedly produced wrong spoken text even
when the queue and bundle files were valid. Queue v3's prewritten
`playback_text` helped define the correct output but did not force Voice to read
it. Asking Voice to reopen the queue before moving to another article sometimes
helped, but it did not always prevent substitutions. Issue #120 is therefore an
experiment, not a proven fix.

Official OpenAI documentation says Project chats can use the same instructions
and uploaded sources. The current Voice page describes desktop Voice and iOS
use paired with a desktop host. It does not promise that standalone iPhone Voice
will open a Project source or reread a file on every turn:

- [Projects and chats](https://learn.chatgpt.com/docs/projects)
- [ChatGPT Voice](https://learn.chatgpt.com/docs/features/voice)

## What stays in the main instructions

The main instructions now tell Voice to:

1. Open the queue file Brad requested.
2. Use the Queue v3 fields `sweep_playback` and `items[].playback_text`.
3. Read the complete `sweep_playback` value exactly.
4. Reopen the same queue file whenever Brad asks for an article and after an
   article discussion.
5. Find the requested object in `items` and read its `playback_text` exactly.
6. Pause after each article and announce when the final article has been read.
7. Use the selected article's exact URL when Brad asks about the source.
8. Follow `session-export.md` for saves, corrections, and the final bundle.

The prompt does not explain normal conversation, list navigation phrases, or
repeat the bundle schema.

## What moved to session-export.md

The new Project source explains how to:

- recognize wiki saves, interest and depth corrections, product problems, and
  general notes;
- copy article identity from the current queue object;
- preserve Brad's exact words;
- leave unclear requests unresolved instead of guessing;
- reopen the original queue and include its full JSON in the bundle;
- record only article visits and moves supported by the chat;
- choose `partial`, `recovered`, or `complete` accurately;
- use the required New York date, time, and filename; and
- create a real downloadable `.txt` file before reporting success.

The chat is the only event record available before export. A spoken
acknowledgment does not write a file. The new source does not revive the failed
live-ledger design or promise silent storage.

## OpenSpec correction

The old Voice requirement said Voice must not search the Project Library after
reading began. That contradicted Brad's request to reopen the same queue before
reading another article.

The updated requirement allows Voice to reopen only the queue file already in
use. It still forbids switching to another queue or rebuilding the current
position from memory. If Voice starts a new chat, Brad must make a new queue
request.

## Changes outside this issue

This issue does not change:

- the Queue v3 or session-bundle JSON structures;
- classification, routing, or the interest profile;
- generated queue content;
- old queue or bundle files;
- file-retention rules;
- scheduled queue creation;
- the iPhone app or Voice client; or
- the live ChatGPT Project beyond the Prompt 4.2 deployment, including its
  required `session-export.md` source (completed and verified September 4,
  2026).

Unclear product-name headlines and missing author or publication fields remain
queue-generation problems. Voice may look up missing attribution from the exact
article URL when Brad asks, but it must say that the answer came from the
article rather than the queue.

## Repository checks

Before handoff, run:

```sh
npm run check
openspec validate bootstrap-llm-wiki-mvp --strict
openspec validate commute-wiki-operating-loop --strict
git diff --check
```

These checks can prove that the text, references, and schemas agree. They cannot
prove what Voice will say on an iPhone.

## Prompt 4.2 deployment procedure

The following deployment was completed and verified September 4, 2026.

In the `LLM-Wiki-Car` Project:

1. Replace the Instructions with the complete contents of
   `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`.
2. Upload `chatgpt-project/session-export.md` to Sources.
3. Leave both files in the same Project.
4. Confirm both changes before recording Prompt 4.2 as live.

To undo the change, restore Prompt 4.1 from Git commit `6a505b9` and remove only
`session-export.md` from Project Sources.

## Later iPhone test

Use one small queue and keep the device and spoken requests the same throughout
the test. Check these separately:

- the opening headline list;
- exact `playback_text` reading;
- returning to the queue after an article discussion;
- moving backward, forward, and directly to a named article;
- saves and corrections;
- interruptions; and
- creation of the bundle on the first request.

Compare the actual iPhone audio with the queue file. A valid bundle or a text
chat does not prove that the spoken audio was correct.
