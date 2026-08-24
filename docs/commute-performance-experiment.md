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

## Passive recording

Do not ask Brad for timing acknowledgments or add checkpoint prompts. Use task,
tool, and GitHub timestamps already available to the agent. At the final
post-merge or complete no-change step, write one `commute-performance-input.v1` JSON file under
`.private/commute-performance/` and finalize it in one command:

```sh
npm run finalize:commute-performance -- \
  --input .private/commute-performance/20260824-input.json \
  --commute-run .private/commute-runs/20260824.json \
  --output .private/commute-performance/20260824.json
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

Record `tool_execution_seconds` as non-overlapping elapsed wall-clock time, not
the sum of individual tool durations. When tools run in parallel, measure the
wall-clock interval occupied by the group once. This keeps tool execution less
than or equal to strict agent-active time and makes the derived agent-
orchestration duration meaningful.

The finalizer validates the complete `commute-run.v1` record, cross-checks its
deterministic unresolved-item count, and links it by hash. For a merged run, one
bounded GitHub state call verifies the PR URL, head SHA, merged state, and merge
timestamp without asking Brad for input. It captures its finalization clock once
and rejects any lifecycle phase later than that instant. It derives gross, busy-adjusted, pre-
PR, PR-to-merge, post-merge, authorization-wait, tool-execution, agent-
orchestration, and user-attention measurements and refuses to overwrite an
existing result. Both inputs and outputs must remain in the gitignored
`.private/` tree, and symbolic links may not escape it. The tracked contracts
are `schema/commute-performance-input-v1.schema.json` and
`schema/commute-performance-run-v1.schema.json`.

## Decision boundary

Report median and P90 after the bounded comparison; do not choose a default
from one fast run. Speed is a win only when conversation coverage, provenance,
validation, durable claims, unresolved evidence, manual corrections, and
review outcomes remain equivalent. If model choice has little effect, use the
phase and tool measurements to prioritize orchestration or review changes.
