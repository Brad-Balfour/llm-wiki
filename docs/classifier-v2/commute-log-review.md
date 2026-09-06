# Commute findings to implement

These findings support the five requirements and the examples Sol should use.
The review covered the dated results and experiment summaries through September 4.
The current requirements incorporate Brad’s later clarifications; this page is
not a list of extra implementation phases.

| Requirement                | Evidence and useful implementation detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 — Two files             | [August 29](../commute-experiment-log.md#august-29-literal-playback-and-export-label-result) and [September 4](../commute-experiment-log.md#september-4-literal-playback-export-recovery-and-trace-memory-result): Voice added or replaced text despite valid prepared strings. Test actual listening with the main/reference split, not just valid exports.                                                                                                                                               |
| R2 — Attribution           | [September 2](../commute-experiment-log.md#september-2-valid-bundles-playback-substitution-and-classifier-feedback-result): missing attribution prompted source lookups. Brad’s current requirement moves that work into generation, before scoring, with explicit absent-byline/failure values and a hostname fallback.                                                                                                                                                                                   |
| R3 — Repeated coverage     | [August 17–18](../commute-experiment-log.md#august-17-18-acceptance-recovery-feedback-and-maintenance-result) contains exact duplicates across editions. [August 20](../commute-experiment-log.md#august-20-acceptance-coverage-and-maintenance-result) includes the same acquisition at different URLs. [August 31](../commute-experiment-log.md#august-31-literal-playback-duplicate-and-export-recovery-result) shows a duplicate with a more useful Dev description/attribution. Test all three cases. |
| R4 — Headline context      | [August 7](../commute-experiment-log.md#august-7-acceptance-and-feedback-result), [August 11](../commute-experiment-log.md#august-11-acceptance-presentation-and-navigation-result) and [September 2](../commute-experiment-log.md#september-2-valid-bundles-playback-substitution-and-classifier-feedback-result): LoopX, Mole, fx and Wigolo illustrate titles that do not explain the item. Keep clear titles short and do not fabricate depth labels from requests for context.                        |
| R5 — Author preferences    | [July 31](../commute-experiment-log.md#july-31-acceptance-and-maintenance-result): Martin Fowler articles should default to high interest and in-depth. [August 10](../commute-experiment-log.md#august-10-fragmentation-bundle-and-retrieval-result): strong Addy Osmani preference; no blanket depth label was supplied.                                                                                                                                                                                 |
| R5 — Robotics/self-driving | [September 1](../commute-experiment-log.md#september-1-literal-playback-wiki-and-four-queue-result) and [September 2](../commute-experiment-log.md#september-2-valid-bundles-playback-substitution-and-classifier-feedback-result): Matic and Waymo corrections, with explicit interest in Tesla/self-driving. Use both axes only where Brad supplied them.                                                                                                                                                |

## Corrections to collect once and verify

Use original queues, labels and complete recorded conversations where needed.
The log is a source pointer, not proof that every correction already exists in
the private label store.

- [August 7](../commute-experiment-log.md#august-7-acceptance-and-feedback-result),
  [August 12](../commute-experiment-log.md#august-12-acceptance-summary-and-roadmap-result)
  and [August 13–14](../commute-experiment-log.md#august-13-14-acceptance-grounding-and-maintenance-result):
  HTMX forms, roadmap decisions and HTML over WebSockets depth corrections.
- [August 15](../commute-experiment-log.md#august-15-acceptance-recovery-and-maintenance-result),
  [August 17–18](../commute-experiment-log.md#august-17-18-acceptance-recovery-feedback-and-maintenance-result)
  and [August 19](../commute-experiment-log.md#august-19-acceptance-recovery-feedback-and-maintenance-result):
  Sol Ultrafast, Agent Plugins, DeepSeek Harness, zero-knowledge proofs,
  disposable CI, software craftsmanship, Saggar and TermDOM.
- [August 21](../commute-experiment-log.md#august-21-acceptance-feedback-and-no-save-result):
  Slack Code, Waymo chip and Fig depth up; Better Batteries and Bun interest down.
- [August 28](../commute-experiment-log.md#august-28-acceptance-conversation-coverage-and-maintenance-result):
  Sass migration, AcceptMarkdown, Claude Cowork and Anthropic lab hardware depth
  up; DuckDB interest down.
- [September 3](../commute-experiment-log.md#september-3-wiki-saves-literal-playback-failures-and-lifecycle-mismatch-result):
  London robotaxis depth up without inventing an interest correction.
- [#35](https://github.com/Brad-Balfour/llm-wiki/issues/35) also records earlier
  Codex selection, Kimi Work, Robots Cometh, Fugu and August 6 examples. Verify
  each original statement and label; do not silently treat an uncertain example
  as a confirmed answer.

## Checks that prevent repeat mistakes

- Look at excluded articles. The [July 28 omission example](../commute-experiment-log.md#july-28-acceptance-and-selection-result)
  illustrates why valid queues do not prove complete selection. It is one
  optional source-backed test, not a required dataset.
- Preserve an explicit correction even when historical routing metadata cannot be
  verified. Do not rename old versions to make a label importer accept them.
- Re-exported bundles, overlapping chats and transcript copies must not multiply
  labels. A correction to depth does not confirm the old interest prediction.
- Reading the original description on request already works; keep it when moving
  descriptions into the reference file.
- Verify downloads and actual phone playback. Preserve the established new-chat
  recovery for a failed final write. Brad’s phone-setting and session-retry issues
  do not add classifier features.
