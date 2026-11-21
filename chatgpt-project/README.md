# LLM-Wiki-Car Project

The `LLM-Wiki-Car` Project creates TLDR queues and plays them during Brad’s
commute. Its Instructions control playback. The `session-export.md` source
controls what the phone sends for nightly intake.

## Install the compact handoff

On November 21, 2026, the signed-in Project Instructions matched the complete Prompt 5.1 at commit `ad5c341`. Compact export installation is pending. After the PR merges:

1. In `LLM-Wiki-Car` Sources, upload
   `schema/commute-session-bundle-v2.schema.json` and replace
   `chatgpt-project/session-export.md` with the merged copy. Retire only the
   old `commute-session-bundle-v1.schema.json` export schema from Sources.
   The repository retains the v1 reader for existing handoffs.
2. Replace the Project Instructions with the exact merged
   `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`. Only the export paragraph
   changes from the verified live playback prompt.
3. Reopen the Instructions and verify the saved text. Check that Sources has
   one copy each of the v2 schema and updated `session-export.md`. Record the
   installed versions and verification date here. Keep the weekday queue Task,
   generation instructions, classifier, profile, playback helper, and queue
   schemas on their existing versions.

For rollback, restore the previous Instructions and `session-export.md`, and
restore the v1 schema from the pre-change revision. Keep any pending v2 exports
for intake. The [earlier installation record](https://github.com/Brad-Balfour/llm-wiki/blob/ad5c341/chatgpt-project/README.md)
records the September 4 verification of Prompt 4.2 and the later Prompt 5.1
Python playback candidate. The candidate’s installation was not recorded there.

## Weekday queue generation

The scheduled Task and manual Project chat use the queue generation prompt for
that queue version. For v4 the files are `WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md`
and `queue-generation-v4.md`. The Project uses `tldr-commute-playback-v4.schema.json`
and `tldr-commute-reference-v4.schema.json` for the pair, plus the classifier,
interest profile, and routing rules in `schema/`. The Python playback prompt
also uses `voice-playback.py` as a Project source. When the scheduled Task
fails to create the files, use the same generation prompt in a manual Project
chat. The [prior installation and rollback instructions](https://github.com/Brad-Balfour/llm-wiki/blob/ad5c341/chatgpt-project/README.md)
cover the v3 and v4 queue configurations.

## Nightly handoff format

The phone writes `commute-session-bundle.v2`. Its `queue_filename` selects the
original v4 playback/reference pair or single v2/v3 queue. Each explicit item action names a
`source_item_id`. The importer takes the article title, URL, and other metadata
from those files. The phone sends the conversation-specific saves, discussion,
feedback, problems, notes, and unresolved requests. A session with no captures
has an empty `events` array.

Keep the original queue and reference in the Library until nightly intake and
post-merge cleanup finish. Multiple exports can share the same pair. Pending v1
exports still import through the existing snapshot and recovery paths.

## Post-Commute Bundle Intake

Use the [daily commute skill](../.codex/skills/process-daily-commute/SKILL.md)
for retrieval, wiki publication, issue updates, and cleanup. The agent retrieves
the bundles and their matching queues. For an already downloaded compact export,
pass the original main and reference files immediately after the bundle:

```sh
npm run commute:run -- \
  --input /path/to/202611211609-evening-commute-session-bundle.txt \
  --queue /path/to/20261118-tldr-dev.txt \
  --reference /path/to/20261118-tldr-dev-reference.txt \
  --output .private/commute-runs/20261121.json
```

For a compact export from a single-file v2/v3 queue, supply `--queue` alone.
For a legacy v1 bundle use `--input`. When recovery requires the original
queue, supply `--recover-with` immediately after its `--input`, together with
the matching reference for queue v4. See the daily commute skill for how to
handle a malformed bundle or an unresolved item.

The importer keeps every valid session even when another is malformed and
writes a private normalized intake record. Exact `wiki this` captures become
pending maintenance candidates without another approval step; classifier
corrections, product-quality incidents, and unresolved captures stay in their
separate private lists. When an exact `wiki this` capture has supported
surrounding discussion, the bundle may include an optional item-bound discussion
record with a concise summary, questions, conclusions, and requested emphasis. The phone ties this context to the explicit save.

```sh
npm run import:commute-session-bundles -- \
  --input /path/to/legacy-morning-bundle.txt \
  --input /path/to/legacy-evening-bundle.txt \
  --output .private/commute-session-imports/20260720.json
```

The top-level maintainer accepts the same adjacent `--recover-with` form when
you want recovery and wiki maintenance in one run.

These commands are agent-invoked implementation stages and diagnostics, not
user approval gates. Keep them available rather than combining or removing
them solely to create a human-facing command surface. The
`maintain:commute` command composes intake, retrieval, existing-wiki inspection,
and branch/PR creation when that full pass is appropriate. Its normal human
decision point is the resulting PR—not an intermediate review of the private
record. That private `intake.json` stores append-only retrieval/maintainer
attempts and a derived latest result for every attempted maintenance candidate.
When retrying the same bundle/event/URL candidate in a new private output
directory, the agent passes the earlier record with
`--prior-intake .private/.../intake.json`. The command rejects mismatched prior
candidate identity instead of treating it as unrelated history, and it skips
candidates whose latest result already created a PR.
Per-candidate maintainer statuses are closed values: `pr_created`, `no_change`,
`insufficient_source`, `unresolved`, or `failed`; change specifics belong in
the result detail. If the maintainer reports a PR but its candidate results
cannot be reconciled safely, the intake records `review_required` and blocks an
automatic retry until that PR is inspected, avoiding duplicate maintenance.
Review early maintainer diffs with
[`docs/wiki-maintainer-pr-review.md`](../docs/wiki-maintainer-pr-review.md);
the checklist distinguishes duplicate concepts, material existing-page updates,
useful link-only changes, and inaccessible-source outcomes without adding an
intermediate approval gate.

Before the first real bundle-to-PR run, confirm that the local maintainer can
launch the installed Codex command without changing the repository:

```sh
npm run diagnose:maintain-commute
```

It uses `COMMUTE_MAINTAINER_CODEX` when explicitly set; otherwise it invokes
the Codex executable bundled with the ChatGPT macOS app. This deliberately
avoids a broken global `codex` npm launcher.
