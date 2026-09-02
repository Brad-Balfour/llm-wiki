# Commute performance experiment

Issue #85 measures whether a less expensive Codex model or reasoning effort can
reduce the time from invoking `/process daily commute` through publication
without weakening evidence integrity or requiring more of Brad's attention.

## Experimental sequence

Treat the August 23, 2026 merges of the publication-policy and unified-
orchestration changes as a new operating epoch. The August 5–21 history remains
the baseline, but it is not directly comparable model evidence for this epoch.

Collect 6–10 representative runs in total. Run the first on Sol Medium as the
post-change control, the second on Terra Medium, then continue alternating the
two arms for the remaining runs. An odd-sized sample ends on the next arm in
that sequence. Keep prompts, deterministic validation, review policy, and daily
scope as stable as practical. Test Terra Low only if Terra Medium preserves
quality. Escalate malformed or ambiguous work to Sol Medium when needed and
record both the actual configuration and reason. Exclude a run from the model
comparison only with a concrete recorded reason; retain its telemetry.
Any assigned/actual model or effort mismatch must set `escalated` to true and
record a reason. An attempted escalation reverted before the final
configuration changed may retain the same assigned and actual values; keep
`escalated: true` and explain the attempt so it remains visible.

## Passive recording

Do not ask Brad for timing acknowledgments or add checkpoint prompts. Use task,
tool, and GitHub timestamps already available to the agent. At the final
post-merge or complete no-change step, write one `commute-performance-input.v1` JSON file under
`.private/commute-performance/` and finalize it in one command:

```sh
npm run finalize:commute-performance -- \
  --input .private/commute-performance/20260824-input.json \
  --commute-run .private/commute-runs/20260824.json \
  --output .private/commute-performance/2026-08-24-tldr.json
```

The input records the assigned and actual model/effort, escalation or exclusion
reason, terminal outcome, ordered lifecycle timestamps, excluded wait, strict
agent-active time, tool calls and execution time, user interventions, review
and re-review counts, failed checks, and quality outcomes. A merged outcome also
records its canonical positive PR URL and head SHA. A no-change outcome omits
PR identity and PR-specific phases; the final record retains those metrics as
`null` rather than inventing a publication window. An intervention is a
user response during processing; mark whether it was genuinely required and
estimate only the user's active response time. Merge authorization is expected
to be one required intervention unless it was already supplied.

Before finalizing, read the selected reasoning label from the active Codex UI
or runtime evidence and record it as `experiment.actual_reasoning_effort_label`.
Do not infer it from the planned experiment arm or a previous run. The desktop
app's `Light` label maps to the canonical `low` telemetry value; the CLI may
display that same value as `Low`. The finalizer rejects a supplied label whose
canonical mapping disagrees with `actual_reasoning_effort`.

Record a `workload` vector for every new run so timing can be normalized against
output and evidence volume: queue items, substantive conversation entries,
bundles, queues, shared chats, issue comments, wiki entries created and updated,
behavior files changed, cleanup artifacts, and the PR's changed-file, addition,
and deletion counts. Use the final GitHub diff for PR counts and the private
coverage/retrieval records for evidence counts; do not estimate missing history.

Record `tool_execution_seconds` as non-overlapping elapsed wall-clock time, not
the sum of individual tool durations. When tools run in parallel, measure the
wall-clock interval occupied by the group once. This keeps tool execution less
than or equal to strict agent-active time and makes the derived agent-
orchestration duration meaningful.

The finalizer validates the complete `commute-run.v1` record, cross-checks its
deterministic unresolved-item count, requires its intake and completion phases
to fall inside the measured lifecycle, and links it by hash. For a merged run,
one bounded GitHub state call verifies the PR URL, head SHA, merged state, and
creation and merge timestamps without asking Brad for input. Merge
authorization after task invocation requires a required intervention record;
equality with task invocation is the preauthorized exception. The finalizer
captures its start clock and rejects input lifecycle phases later than
that instant. It measures its own execution through payload persistence, then
adds that duration and one tool call to the finalized totals. The interval
between the input cutoff and finalizer start is excluded from busy-adjusted
time; it is not assumed to be agent activity. It derives gross, busy-adjusted, pre-PR, PR-to-merge, post-merge,
authorization-wait, tool-execution, agent-orchestration, and user-attention
measurements and refuses to overwrite an existing result. Both inputs and
outputs must remain in the gitignored `.private/` tree, and symbolic links may
not escape it. The tracked contracts are
`schema/commute-performance-input-v1.schema.json`,
`schema/commute-performance-run-v1.schema.json`, and
`schema/commute-phase-profile-v1.schema.json`.

`run_id` uses only lowercase letters, digits, underscores, and hyphens. Its one
canonical finalized destination is
`.private/commute-performance/<run_id>.json`; aliases are rejected and the
existing no-overwrite rule remains in force.

## Five-phase profiling (#119)

For the next 3–5 representative commutes, start and finish phases using existing
task timestamps and tool elapsed results, without checkpoint prompts. Keep a
private draft at `.private/commute-performance/<run_id>-phase-input.json`.
The versioned contract is
[`commute-phase-profile.v1`](../schema/commute-phase-profile-v1.schema.json).
Its top-level fields are `schema_version`, the performance record's `run_id`,
actual `model`, canonical `reasoning_effort` (Light maps to `low`), and `phases`.

| Phase                      | Work included                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `acquisition`              | Library queues/bundles, shared chats, downloads, initial hashing                                                       |
| `evidence_processing`      | Decode, normalize, validate, compare queues, audit coverage, reconcile, decide classifier evidence and durable actions |
| `repository_work`          | Source research, wiki/log synthesis, tracked edits, local review                                                       |
| `verification_publication` | Tests, lint, format, site, OpenSpec, diff checks, commit/push/PR, issue routing, CI, review/rework                     |
| `cleanup_finalization`     | Pull merged main, cleanup/verification, finalization, handoff preparation                                              |

Every phase object requires `phase`, RFC3339 `started_at` and `completed_at`,
`active_seconds`, `tool_execution_seconds`, integer `tool_call_count`,
`retry_seconds`, integer `work_units`, and `note` (normally null). All five phases
are required, including no-change runs. A skipped phase uses zero measurements
and a short reason. Calls completing within timestamp resolution may have zero
seconds with a positive call count; those are not skipped work.

Use first/last timestamps when revisiting a phase, but count each active interval
and call in exactly one phase. Phase envelopes can include inactive gaps; do not
mistake envelope duration for strict agent-active time. Exclude all human/merge
waiting. Tool time is non-overlapping wall time: parallel calls count once,
including groups crossing phase boundaries. This recorder accepts aggregates,
not raw intervals. Retry time covers only failed, repeated or avoidable tool
work. Require `retry <= tool <= active`; derive orchestration residual as active
minus tool, never as estimated “LLM inference time.” Do not estimate from tokens.

Set `work_units` to the finalized workload's independently processed bundle/
session count for each active phase. Notes are at most 160 characters and only
explain unusual comparison-relevant work. Store no prompts, chat content,
commands/output, URLs, secrets or personal details in the profile.

Prepare the handoff and freeze the draft and performance input at the same
cutoff before invoking `npm run finalize:commute-performance` exactly once as
shown above. Do not pre-count the finalizer call or guess its duration. The
finalizer measures its validation, GitHub verification and payload write/sync,
then includes those seconds in run active/tool totals and one call in its count.
An optional `finalization` object records the input cutoff, start/completion
clocks and included tool duration/count; historical records omit this object.

The payload is written privately first. After measuring it, the finalizer writes
its timing fields and publishes the complete file with an exclusive hard link;
existing results cannot be overwritten. Only the trailing timing-field write,
publication/cleanup of the staging file, and subsequent report delivery are
outside the measurement. A record cannot include the elapsed time of writing
its own final timestamp; no duration is invented for that tail. Finalization
errors publish no partial canonical JSON. Build/bootstrap before the finalizer
starts is also outside its self-measurement; perform substantial build work
before freezing the input.

Then record the profile:

```sh
node dist/src/commute/phase-profile.js record \
  .private/commute-performance/<run_id>-phase-input.json \
  .private/commute-performance/<run_id>.json
```

`record` validates the draft against pre-finalizer totals, automatically adds
measured finalization to `cleanup_finalization` exactly once, and validates the
result against finalized totals. It exclusively creates
`.private/commute-performance/<run_id>-phase-profile.json` and prints a Markdown
table of active/tool/residual/retry seconds and seconds per bundle, with totals.
No bundle denominator is reported as `n/a`. Totals must reconcile within two
seconds of rounding for active/tool time and exactly for call counts. Resolve
mismatches from timing evidence instead of adjusting figures to pass validation.
Both input paths and the output must remain in `.private/`, including symlinks.
The finalized-run input must use its canonical `<run_id>.json` path.

Reprint an existing profile without changing it or adding finalization again:

```sh
node dist/src/commute/phase-profile.js summary \
  .private/commute-performance/<run_id>-phase-profile.json \
  .private/commute-performance/<run_id>.json
```

After 3–5 runs, update #85 with median/P90 active time, median tool/residual
shares, cumulative retry waste, seconds/bundle, phases ranked by total time and
variance, one optimization with expected seconds saved, and the updated
workload-adjusted Light-versus-Medium estimate. Preserve the seven-run baseline
`active_seconds ≈ 540 + 219 × bundles − 257 × Light` (R² 0.993; residual standard
error about 48 seconds). Historical phase timing remains unknown; never allocate
historical aggregate time across phases.

## Decision boundary

Report median and P90 after the bounded comparison; do not choose a default
from one fast run. Speed is a win only when conversation coverage, provenance,
validation, durable claims, unresolved evidence, manual corrections, and
review outcomes remain equivalent. If model choice has little effect, use the
phase and tool measurements to prioritize orchestration or review changes.
