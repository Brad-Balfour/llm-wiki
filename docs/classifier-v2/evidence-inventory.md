# Classifier v2 evidence inventory

Snapshot: September 5, 2026 America/New_York (September 6 UTC). Repository baseline: `d548814` (`origin/main`).

Read all 16 open issue bodies and all 74 comments. GitHub REST comment counts independently matched the CLI export, with no additional open-issue page. This inventory includes unrelated issues so the scope exclusion is auditable. Issue state is a snapshot, not a promise that it remains open.

The linked requirements and plan are a proposal. Newer dated evidence and implemented contracts supersede stale opening descriptions. No issue was edited or closed during this review.

## All open issues

| Issue                                                                                                                                                         | Comments read | Updated (UTC)        | Disposition                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------: | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#8 — Investigate GitHub Pages caching after wiki deployments](https://github.com/Brad-Balfour/llm-wiki/issues/8)                                             |             0 | 2026-07-22T02:07:04Z | Outside v2: Pages cache propagation; retain publication checks without making this a classifier dependency.                                       |
| [#26 — Is the wiki article creation really following the Karpathy & OKR approach](https://github.com/Brad-Balfour/llm-wiki/issues/26)                         |             6 | 2026-09-05T01:22:30Z | Downstream integration: preserve source URLs, context and provenance for source-grounded wiki enrichment; classification never authorizes a save. |
| [#35 — Classifier evolution: evidence, calibration, and measured profile updates](https://github.com/Brad-Balfour/llm-wiki/issues/35)                         |            23 | 2026-09-04T10:51:10Z | Core umbrella: evidence channel separation, score-first independent axes, measured preference evolution.                                          |
| [#36 — Deduplicate articles across daily newsletter commute queues](https://github.com/Brad-Balfour/llm-wiki/issues/36)                                       |            13 | 2026-09-01T01:07:42Z | Queue-product requirement: day-level exact canonical URL grouping, all-source provenance, replay and later related-story annotation.              |
| [#37 — Debug scheduled Gmail-to-commute-queue Project task](https://github.com/Brad-Balfour/llm-wiki/issues/37)                                               |             2 | 2026-07-29T02:05:31Z | Operational requirement: same-Project manual control, observable real files, phone-only availability and scheduled delivery testing.              |
| [#48 — Add timeout and cleanup to stalled commute maintainer runs](https://github.com/Brad-Balfour/llm-wiki/issues/48)                                        |             0 | 2026-07-28T02:21:00Z | Adjacent maintainer reliability: timeout and cleanup remain separate from classifier rollout.                                                     |
| [#52 — Add useful full-text search to the wiki](https://github.com/Brad-Balfour/llm-wiki/issues/52)                                                           |             0 | 2026-07-30T01:05:36Z | Outside v2: public wiki search does not block classification or queue production.                                                                 |
| [#66 — Classifier evolution: capture full-candidate diagnostics and build the calibration corpus](https://github.com/Brad-Balfour/llm-wiki/issues/66)         |             8 | 2026-09-04T10:51:12Z | First core milestone: every-candidate diagnostics, July 28 coverage, evidence/version reconciliation, frozen baseline and replacement holdout.    |
| [#68 — Classifier evolution: run the weakest-valid-revision experiment and decide production integration](https://github.com/Brad-Balfour/llm-wiki/issues/68) |             2 | 2026-09-04T10:51:12Z | Core experiment and promotion: four blind weekly cycles, competing rules, harm/pacing gates and runtime/feedback decisions.                       |
| [#85 — Benchmark commute performance and choose the routine model/effort](https://github.com/Brad-Balfour/llm-wiki/issues/85)                                 |            10 | 2026-09-05T01:43:40Z | Adjacent measurement: reuse passive quality/time concepts, but do not transfer commute-maintainer model results to the classifier.                |
| [#94 — Make commute commands reject invalid arguments before doing work](https://github.com/Brad-Balfour/llm-wiki/issues/94)                                  |             0 | 2026-08-24T02:28:27Z | Shared CLI constraint: fail before retrieval/model work, reject malformed flags and enforce private paths; no broad CLI refactor required for v2. |
| [#95 — Split session-bundle reconciliation into smaller tested steps](https://github.com/Brad-Balfour/llm-wiki/issues/95)                                     |             1 | 2026-09-04T10:51:15Z | Consumer compatibility: retain strict validation versus recovery and valid-session isolation; separate refactor.                                  |
| [#96 — Split the pre-PR maintainer command into measurable, testable steps](https://github.com/Brad-Balfour/llm-wiki/issues/96)                               |             0 | 2026-08-24T02:28:27Z | Adjacent maintainer refactor: no change to publication ownership or restart semantics in v2.                                                      |
| [#100 — Keep ChatGPT Voice playback bound to the verified queue on every turn](https://github.com/Brad-Balfour/llm-wiki/issues/100)                           |             9 | 2026-09-05T01:22:28Z | Playback acceptance dependency: canonical queue binding and actual iPhone observation; scoring changes cannot guarantee Voice compliance.         |
| [#112 — rearrange the mac project directory and github locations](https://github.com/Brad-Balfour/llm-wiki/issues/112)                                        |             0 | 2026-08-29T12:04:59Z | Outside v2: repository relocation is a separate task; use an isolated worktree under the current layout.                                          |
| [#119 — Add lightweight phase profiling to identify commute bottlenecks](https://github.com/Brad-Balfour/llm-wiki/issues/119)                                 |             0 | 2026-09-02T01:54:23Z | Already instrumented, experiment still open: use measured phase outcomes for future optimization, avoid a new telemetry framework.                |

## Discussion index

Every comment below was reviewed. Opening-body acceptance criteria also apply except where explicitly superseded in the requirements.

### #26 — Is the wiki article creation really following the Karpathy & OKR approach

- [2026-08-16 — August 16 source-grounded enrichment and cross-link result](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5308921343)
- [2026-08-19 — August 17-18 source-grounded enrichment result](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5336585452)
- [2026-08-21 — Draft PR #82 adds source-grounded maintenance for the August 20 Redis save.](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5364543229)
- [2026-09-02 — September 1 compounding-wiki result](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5502574855)
- [2026-09-03 — September 2 commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5518717792)
- [2026-09-05 — September 4 source-grounded enrichment result](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5548381015)

### #35 — Classifier evolution: evidence, calibration, and measured profile updates

- [2026-07-25 — Commute calibration evidence — 2026-07-24](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5079087477)
- [2026-07-25 — Historical commute calibration backfill — 2026-07-12 through 2026-07-15](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5079147946)
- [2026-07-26 — Exact classifier correction labels — 2026-07-24](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5085277412)
- [2026-07-26 — Implementation is now in review as #44. It adds exact queue-bound private JSONL storage and a recording command without consuming labels in the live classifier. The two July 24 lab](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5085416654)
- [2026-07-29 — Queue-selection coverage evidence — 2026-07-28](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5111996563)
- [2026-08-07 — Post-July conversation audit — 2026-07-29 through 2026-08-06](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5211472592)
- [2026-08-08 — August 7 commute calibration evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5223923988)
- [2026-08-12 — August 11 presentation evidence — keep outside classifier learning](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5261204426)
- [2026-08-13 — August 12 classifier evidence is captured in draft PR #74.](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5274608161)
- [2026-08-15 — August 13-14 exact depth-correction evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5299910774)
- [2026-08-15 — August 15 exact depth-correction evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5303759606)
- [2026-08-16 — August 16 classifier-channel result](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5308921088)
- [2026-08-19 — Exact classifier and QA evidence — 2026-08-18](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5336585434)
- [2026-08-20 — August 19 classifier and presentation evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5350283459)
- [2026-08-21 — August 20 classifier/queue QA evidence is in draft PR #82.](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5364543054)
- [2026-08-22 — August 21 classifier evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5376855376)
- [2026-08-27 — August 26 supplies no score-bearing classifier correction. Brad said GlassBox was useless as a headline-only experience while explicitly allowing that the underlying classification](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5433680168)
- [2026-08-28 — August 27 classifier-QA evidence: the August 26 AI queue item `1a03e45d721aaf81-03`, _Vocab Break_, was classified `maybe` (0.72), `headline_only` (0.55), and `optional_quick_read`](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5447214608)
- [2026-08-29 — August 28 classifier evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5459665156)
- [2026-09-01 — August 31 classifier and queue-presentation QA](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5486999811)
- [2026-09-02 — September 1 exact classifier evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5502574551)
- [2026-09-03 — September 2 commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5518717363)
- [2026-09-04 — September 3 exact depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5539382947)

### #36 — Deduplicate articles across daily newsletter commute queues

- [2026-07-28 — Additional real-drive evidence from 2026-07-27:](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5099170412)
- [2026-07-29 — Additional commute duplicate signal — 2026-07-28](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5111998002)
- [2026-08-08 — Additional exact duplicate evidence — 2026-08-07](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5223924251)
- [2026-08-12 — Additional exact duplicate evidence — 2026-08-11](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5261204069)
- [2026-08-13 — August 12 adds two day-level prior-awareness signals; both are documented in draft PR #74.](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5274608251)
- [2026-08-19 — Additional exact duplicate evidence — 2026-08-17 and 2026-08-18](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5336585446)
- [2026-08-20 — Additional duplicate and same-story evidence — August 18-19](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5350284385)
- [2026-08-21 — August 20 adds another same-story cross-queue case in draft PR #82: General Stripe says the singularity has begun and Dev OpenRouter is Joining Stripe cover the same acquisition st](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5364543297)
- [2026-08-22 — Additional duplicate evidence — August 20-21](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5376855431)
- [2026-08-24 — 2026-08-24 adds another exact cross-newsletter duplicate.](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5402638810)
- [2026-08-25 — Architecture decision after the August 24 reassessment](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5403657480)
- [2026-08-27 — August 26 prior-awareness evidence: Brad recognized GitLab's “When code is abundant” as similar to recent AI-native SDLC material, and the source explicitly responds to Anthropic's](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5433680015)
- [2026-09-01 — August 31 cross-newsletter duplicate](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5486999920)

### #37 — Debug scheduled Gmail-to-commute-queue Project task

- [2026-07-26 — Live scheduled-task audit — 2026-07-26](https://github.com/Brad-Balfour/llm-wiki/issues/37#issuecomment-5084284240)
- [2026-07-29 — Scheduled-task reproduction — 2026-07-28](https://github.com/Brad-Balfour/llm-wiki/issues/37#issuecomment-5111951260)

### #66 — Classifier evolution: capture full-candidate diagnostics and build the calibration corpus

- [2026-08-19 — August 17-18 queue-metadata evidence](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5336585418)
- [2026-08-20 — August 19 exact-label and metadata evidence](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5350283979)
- [2026-08-22 — August 21 exact-label and provenance evidence](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5376855378)
- [2026-08-27 — Diagnostic evidence from August 26: GlassBox exposed a mismatch between bundle-standardized promote_to_in_depth and the user's actual statement that headline-only presentation was ](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5433679936)
- [2026-08-28 — August 27 adds a useful diagnostic example to the calibration corpus without adding a ground-truth label correction.](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5447215002)
- [2026-08-29 — August 28 adds five exact correction candidates plus three diagnostic headline-informativeness cases to the future calibration corpus.](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5459665359)
- [2026-09-03 — September 2 commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5518717537)
- [2026-09-04 — September 3 calibration-corpus evidence](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5539383349)

### #68 — Classifier evolution: run the weakest-valid-revision experiment and decide production integration

- [2026-09-03 — September 2 commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/68#issuecomment-5518717670)
- [2026-09-04 — September 3 experiment input](https://github.com/Brad-Balfour/llm-wiki/issues/68#issuecomment-5539383186)

### #85 — Benchmark commute performance and choose the routine model/effort

- [2026-08-24 — Started the post-August-23 measurement epoch in PR #97. The existing 13-run history predates both PR #89 (publication policy) and PR #92 (unified orchestration), so it remains the ](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5389424583)
- [2026-08-24 — Protocol clarification: the bounded comparison is 6-10 representative runs total, including the first Sol Medium control and second Terra Medium run. Continue alternating for the r](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5389438457)
- [2026-08-28 — August 27 terminal measurement (`2026-08-27-sol-medium`) is finalized after PR #104 merge, exact artifact cleanup, and the two evidence-driven follow-up issues.](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451572381)
- [2026-08-28 — August 26 terminal measurement (`2026-08-26-sol-medium`) is finalized after PR #103 merge and terminal cleanup.](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451598612)
- [2026-08-28 — August 25 completion measurement is the finalized `2026-08-24-tldr` commute run. The intake began August 24 and PR #99 merged, cleanup completed, and the terminal record finalized ](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451621486)
- [2026-08-29 — August 28 terminal measurement (`2026-08-28-sol-medium`) is finalized after PR #109 merged and exact cleanup completed.](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5459722233)
- [2026-08-29 — Protocol correction — Terra arm abandoned](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5461998888)
- [2026-08-29 — Follow-up experimental option](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5462003204)
- [2026-09-03 — September 2 terminal timing is finalized after PR #122 merged, main was pulled, and all exact transient artifacts were cleaned up. The runtime configuration remained Sol Low (the c](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5518912729)
- [2026-09-05 — September 4 terminal timing (`2026-09-04-tldr`) is finalized after PR #125 merged, main was pulled, and all six exact transient artifacts were cleaned up. Assigned/actual configura](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5548502545)

### #95 — Split session-bundle reconciliation into smaller tested steps

- [2026-09-04 — September 3 reconciliation evidence](https://github.com/Brad-Balfour/llm-wiki/issues/95#issuecomment-5539383886)

### #100 — Keep ChatGPT Voice playback bound to the verified queue on every turn

- [2026-08-27 — August 26 adds five complete Voice chats and five session artifacts. The repeated phrase “go to next and reread the queue” was a useful operator technique for expressing the intend](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5433680051)
- [2026-08-28 — August 27 commute evidence adds a concrete supported-mechanism experiment for this issue.](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5447214292)
- [2026-08-29 — August 28 provides another long-session grounding result across four complete conversations, four exact queues, and four strict-valid bundles.](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5459665562)
- [2026-08-29 — 2026-08-29 AI commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5464455502)
- [2026-09-01 — August 31 literal-playback evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5486999875)
- [2026-09-02 — September 1 literal-playback and export evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5502574588)
- [2026-09-03 — September 2 commute evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5518717056)
- [2026-09-04 — September 3 literal-playback evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5539383161)
- [2026-09-05 — September 4 literal-playback and export evidence](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5548380809)

## Additional inspected evidence

- [#106](https://github.com/Brad-Balfour/llm-wiki/issues/106), closed by [PR #110](https://github.com/Brad-Balfour/llm-wiki/pull/110): pre-rendered playback is already implemented as queue v3. Its closure does not establish perfect Voice compliance.
- [#120](https://github.com/Brad-Balfour/llm-wiki/issues/120), closed: Prompt 4.2 and separate export source were verified live September 4; the last comment proposes a physically separate minimal playback artifact as a further experiment.
- Repository contracts: [bootstrap design](../../openspec/changes/bootstrap-llm-wiki-mvp/design.md), [operating-loop design and precedence map](../../openspec/changes/commute-wiki-operating-loop/design.md), [live Project source record](../../chatgpt-project/README.md), [experiment log](../commute-experiment-log.md), classifier types/validator, routing implementation, current queue-generation instructions and schemas.
- Historical local research archive was read, not copied: `codex-docs/tldr-interest-profile-session-state.md`; `codex-docs/schema/tldr-holdout-comparison.md`; `codex-docs/schema/tldr-fresh-holdout-comparison-two-axis.md`; `codex-docs/schema/tldr-fresh-holdout-comparison-two-axis-calibration-v2.md`. These paths are relative to the parent research workspace and are not public repository dependencies. Aggregate lessons are reproduced in the requirements; raw labels and private research text remain outside Git.

## Gmail feasibility check

Read-only ID searches returned 85 candidates for `in:trash from:(tldrnewsletter.com) after:2026/08/01 before:2026/09/06`, and 10 for `in:anywhere from:(tldrnewsletter.com) after:2026/07/27 before:2026/07/30`, both without another page. These are message-search candidates, not body-confirmed edition or article counts. No message bodies were read or saved, and no mailbox state was changed. This inventory does not establish which July 28 editions are recoverable or which messages are clean holdout material.

Gmail removes messages after 30 days in Trash, measured from deletion rather than delivery. Recovery should therefore start with sanitized extraction, not wait until the four-week experiment ends. See [Gmail deletion policy](https://support.google.com/mail/answer/7401). A future direct API adapter must explicitly include Trash using `includeSpamTrash`; see [messages.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list).

## Reading order

1. [Requirements and evidence reconciliation](requirements.md)
2. [Stacked PR and evaluation plan](implementation-plan.md)
