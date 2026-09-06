# Classifier v2 evidence inventory

Snapshot: September 5, 2026 America/New_York (September 6 UTC). Repository version reviewed: `d548814` (`origin/main`).

The review covered all 16 open issues and all 74 comments. A second GitHub query confirmed the same counts and no additional results. Unrelated issues are listed too, with the reason they are outside this plan. These were the open issues at the time of review.

The requirements and plan are proposals. Where an issue’s original description is out of date, the plan uses later evidence and the requirements already implemented. No issue was edited or closed during the review.

The later [detailed commute log review](commute-log-review.md) records additions
and clarifications from the dated experiment entries, supporting planning
records and Brad’s PR review. It distinguishes classifier work from solved
behavior and separate commute workflow problems.

## All open issues

| Issue                                                                                                                                                         | Comments read | Last updated (UTC)   | How it affects this plan                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------: | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#8 — Investigate GitHub Pages caching after wiki deployments](https://github.com/Brad-Balfour/llm-wiki/issues/8)                                             |             0 | 2026-07-22T02:07:04Z | Separate work: delays in showing published wiki changes. Keep publication checks, but do not make this a classifier dependency.                                 |
| [#26 — Is the wiki article creation really following the Karpathy & OKR approach](https://github.com/Brad-Balfour/llm-wiki/issues/26)                         |             6 | 2026-09-05T01:22:30Z | Keep article URLs and source details so wiki updates can use the full articles. Classification alone does not authorize a wiki save.                            |
| [#35 — Classifier evolution: evidence, calibration, and measured profile updates](https://github.com/Brad-Balfour/llm-wiki/issues/35)                         |            23 | 2026-09-04T10:51:10Z | Main classifier issue: distinguish feedback from playback problems, score interest and depth separately, and measure rule changes.                              |
| [#36 — Deduplicate articles across daily newsletter commute queues](https://github.com/Brad-Balfour/llm-wiki/issues/36)                                       |            13 | 2026-09-01T01:07:42Z | Remove exact duplicate URLs across daily queues, retain every source, allow replay, and test similar-story notes later.                                         |
| [#37 — Debug scheduled Gmail-to-commute-queue Project task](https://github.com/Brad-Balfour/llm-wiki/issues/37)                                               |             2 | 2026-07-29T02:05:31Z | Keep the manual same-Project fallback. Verify real files, phone access and scheduled delivery.                                                                  |
| [#48 — Add timeout and cleanup to stalled commute maintainer runs](https://github.com/Brad-Balfour/llm-wiki/issues/48)                                        |             0 | 2026-07-28T02:21:00Z | Separate work: stop stalled wiki-update processes and clean up their temporary files.                                                                           |
| [#52 — Add useful full-text search to the wiki](https://github.com/Brad-Balfour/llm-wiki/issues/52)                                                           |             0 | 2026-07-30T01:05:36Z | Separate work: wiki search does not block classification or queue generation.                                                                                   |
| [#66 — Classifier evolution: capture full-candidate diagnostics and build the calibration corpus](https://github.com/Brad-Balfour/llm-wiki/issues/66)         |             8 | 2026-09-04T10:51:12Z | First classifier work: record every article and omission, recover July 28 coverage, verify old feedback and versions, and reserve a new final test set.         |
| [#68 — Classifier evolution: run the weakest-valid-revision experiment and decide production integration](https://github.com/Brad-Balfour/llm-wiki/issues/68) |             2 | 2026-09-04T10:51:12Z | Compare proposed rules over four blind weekly reviews. Decide whether to change scoring and whether a local classifier is useful.                               |
| [#85 — Benchmark commute performance and choose the routine model/effort](https://github.com/Brad-Balfour/llm-wiki/issues/85)                                 |            10 | 2026-09-05T01:43:40Z | Use its lessons about measuring time and quality. Its model comparison concerns commute processing, not article scoring.                                        |
| [#94 — Make commute commands reject invalid arguments before doing work](https://github.com/Brad-Balfour/llm-wiki/issues/94)                                  |             0 | 2026-08-24T02:28:27Z | New commands should reject invalid arguments and unsafe private-file paths before starting work. A broad command rewrite is not required.                       |
| [#95 — Split session-bundle reconciliation into smaller tested steps](https://github.com/Brad-Balfour/llm-wiki/issues/95)                                     |             1 | 2026-09-04T10:51:15Z | Keep valid sessions usable when another session fails. Preserve separate rules for strict checking and recovery; leave the larger code reorganization separate. |
| [#96 — Split the pre-PR maintainer command into measurable, testable steps](https://github.com/Brad-Balfour/llm-wiki/issues/96)                               |             0 | 2026-08-24T02:28:27Z | Separate work: reorganize wiki-update code without changing publication or retry behavior.                                                                      |
| [#100 — Keep ChatGPT Voice playback bound to the verified queue on every turn](https://github.com/Brad-Balfour/llm-wiki/issues/100)                           |             9 | 2026-09-05T01:22:28Z | Test whether actual iPhone Voice keeps reading the correct queue. Better classification cannot guarantee correct playback.                                      |
| [#112 — rearrange the mac project directory and github locations](https://github.com/Brad-Balfour/llm-wiki/issues/112)                                        |             0 | 2026-08-29T12:04:59Z | Separate work: reorganize the repository folders. Use the existing isolated checkout for this plan.                                                             |
| [#119 — Add lightweight phase profiling to identify commute bottlenecks](https://github.com/Brad-Balfour/llm-wiki/issues/119)                                 |             0 | 2026-09-02T01:54:23Z | Timing records have been added, but the experiment remains open. Use the results before adding more measurement tools.                                          |

## Discussion index

All comments below were reviewed. The original issue requirements still apply unless the requirements document explains a later change. Link labels summarize the comments; issue titles are kept as written on GitHub.

### #26 — Is the wiki article creation really following the Karpathy & OKR approach

- [2026-08-16 — August 16: wiki pages use full sources and link related ideas](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5308921343)
- [2026-08-19 — August 17–18: new and updated wiki pages](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5336585452)
- [2026-08-21 — August 20: Redis article used to update the wiki](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5364543229)
- [2026-09-02 — September 1: related ideas added to existing wiki knowledge](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5502574855)
- [2026-09-03 — September 2: requests for practical advice from the full articles](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5518717792)
- [2026-09-05 — September 4: memory article used to enrich an existing page](https://github.com/Brad-Balfour/llm-wiki/issues/26#issuecomment-5548381015)

### #35 — Classifier evolution: evidence, calibration, and measured profile updates

- [2026-07-25 — July 24: depth, accessibility and duplicate feedback](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5079087477)
- [2026-07-25 — July 12–15: earlier preferences and playback problems](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5079147946)
- [2026-07-26 — July 24: two proposed correction records](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5085277412)
- [2026-07-26 — PR #44 adds private feedback storage](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5085416654)
- [2026-07-29 — July 28: very few articles reached the queues](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5111996563)
- [2026-08-07 — July 29–August 6: additional corrections and version inconsistencies](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5211472592)
- [2026-08-08 — August 7: HTMX depth correction and short-headline feedback](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5223923988)
- [2026-08-12 — August 11: presentation problems, not scoring corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5261204426)
- [2026-08-13 — August 12: roadmap article depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5274608161)
- [2026-08-15 — August 13–14: WebSockets depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5299910774)
- [2026-08-15 — August 15: three explicit depth corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5303759606)
- [2026-08-16 — August 16: no exact classifier corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5308921088)
- [2026-08-19 — August 18: two depth corrections and unclear product-name feedback](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5336585434)
- [2026-08-20 — August 19: depth corrections and unclear headlines](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5350283459)
- [2026-08-21 — August 20: robotics interest and the unclear fx headline](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5364543054)
- [2026-08-22 — August 21: five exact corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5376855376)
- [2026-08-27 — August 26: GlassBox feedback does not specify a depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5433680168)
- [2026-08-28 — August 27: Vocab Break headline is unclear; no corrected score](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5447214608)
- [2026-08-29 — August 28: five corrections and separate headline feedback](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5459665156)
- [2026-09-01 — August 31: unclear headline and duplicate article](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5486999811)
- [2026-09-02 — September 1: Matic interest and depth corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5502574551)
- [2026-09-03 — September 2: Waymo interest and depth corrections](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5518717363)
- [2026-09-04 — September 3: London robotaxi depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/35#issuecomment-5539382947)

### #36 — Deduplicate articles across daily newsletter commute queues

- [2026-07-28 — July 27: repeated articles with matching URLs](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5099170412)
- [2026-07-29 — July 28: Brad reports a cross-newsletter repeat](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5111998002)
- [2026-08-08 — August 7: three matching-URL pairs](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5223924251)
- [2026-08-12 — August 11: matching URLs and related stories](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5261204069)
- [2026-08-13 — August 12: repeated article and related-topic observation](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5274608251)
- [2026-08-19 — August 17–18: five duplicate groups](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5336585446)
- [2026-08-20 — August 18–19: matching articles and related stories](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5350284385)
- [2026-08-21 — August 20: two sources cover the same acquisition](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5364543297)
- [2026-08-22 — August 20–21: matching URLs and the Slack Code story](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5376855431)
- [2026-08-24 — August 24: Dan Luu article repeated across newsletters](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5402638810)
- [2026-08-25 — August 24 decision: retain Project generation and group the day’s articles](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5403657480)
- [2026-08-27 — August 26: GitLab article relates to earlier Anthropic material](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5433680015)
- [2026-09-01 — August 31: Bug blindness repeated with different context](https://github.com/Brad-Balfour/llm-wiki/issues/36#issuecomment-5486999920)

### #37 — Debug scheduled Gmail-to-commute-queue Project task

- [2026-07-26 — July 26: live Task configuration and scheduled/manual comparison](https://github.com/Brad-Balfour/llm-wiki/issues/37#issuecomment-5084284240)
- [2026-07-29 — July 28: scheduled file creation fails again; manual run succeeds](https://github.com/Brad-Balfour/llm-wiki/issues/37#issuecomment-5111951260)

### #66 — Classifier evolution: capture full-candidate diagnostics and build the calibration corpus

- [2026-08-19 — August 17–18: queue version fields prevent feedback recording](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5336585418)
- [2026-08-20 — August 19: exact feedback retained despite version mismatch](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5350283979)
- [2026-08-22 — August 21: five corrections blocked by version mismatch](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5376855378)
- [2026-08-27 — August 26: GlassBox presentation complaint was mislabeled as a correction](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5433679936)
- [2026-08-28 — August 27: Vocab Break belongs in presentation feedback](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5447215002)
- [2026-08-29 — August 28: five corrections and three presentation cases](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5459665359)
- [2026-09-03 — September 2: Waymo corrections and separate Wigolo feedback](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5518717537)
- [2026-09-04 — September 3: London robotaxi depth correction](https://github.com/Brad-Balfour/llm-wiki/issues/66#issuecomment-5539383349)

### #68 — Classifier evolution: run the weakest-valid-revision experiment and decide production integration

- [2026-09-03 — September 2: new Waymo corrections for the future experiment](https://github.com/Brad-Balfour/llm-wiki/issues/68#issuecomment-5518717670)
- [2026-09-04 — September 3: new depth correction; no live scoring change](https://github.com/Brad-Balfour/llm-wiki/issues/68#issuecomment-5539383186)

### #85 — Benchmark commute performance and choose the routine model/effort

- [2026-08-24 — Start a new timing comparison after workflow changes](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5389424583)
- [2026-08-24 — Clarify the comparison covers 6–10 runs total](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5389438457)
- [2026-08-28 — August 27: final time and quality measurements](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451572381)
- [2026-08-28 — August 26: final time and quality measurements](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451598612)
- [2026-08-28 — August 24–25: one completed run, not two](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5451621486)
- [2026-08-29 — August 28: final time and quality measurements](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5459722233)
- [2026-08-29 — Stop testing Terra after it fails the workflow](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5461998888)
- [2026-08-29 — Consider Sol Light as the next comparison](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5462003204)
- [2026-09-03 — September 2: phase timings and avoidable repeated work](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5518912729)
- [2026-09-05 — September 4: updated phase results and comparison limits](https://github.com/Brad-Balfour/llm-wiki/issues/85#issuecomment-5548502545)

### #95 — Split session-bundle reconciliation into smaller tested steps

- [2026-09-04 — September 3: separate invalid event order from a verified save request](https://github.com/Brad-Balfour/llm-wiki/issues/95#issuecomment-5539383886)

### #100 — Keep ChatGPT Voice playback bound to the verified queue on every turn

- [2026-08-27 — August 26: repeated requests to reread the queue do not prevent errors](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5433680051)
- [2026-08-28 — August 27: proposal to prepare one exact playback string](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5447214292)
- [2026-08-29 — August 28: long sessions still omit or replace queue text](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5459665562)
- [2026-08-29 — August 29: prepared playback strings do not prevent Voice substitutions](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5464455502)
- [2026-09-01 — August 31: Voice substitutes articles after reopening the queue](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5486999875)
- [2026-09-02 — September 1: literal playback and file-export failures](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5502574588)
- [2026-09-03 — September 2: valid files still produce wrong spoken content](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5518717056)
- [2026-09-04 — September 3: wrong counts, omitted descriptions and unrelated text](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5539383161)
- [2026-09-05 — September 4: Prompt 4.2 still has playback and export failures](https://github.com/Brad-Balfour/llm-wiki/issues/100#issuecomment-5548380809)

## Additional inspected evidence

- [#106](https://github.com/Brad-Balfour/llm-wiki/issues/106), closed by [PR #110](https://github.com/Brad-Balfour/llm-wiki/pull/110): queue v3 already contains prepared playback text. Closing the issue does not mean Voice always reads that text correctly.
- [#120](https://github.com/Brad-Balfour/llm-wiki/issues/120), closed: Prompt 4.2 and separate export source were verified live September 4; the last comment proposes a separate, smaller playback file as a further experiment.
- Repository requirements: [bootstrap design](../../openspec/changes/bootstrap-llm-wiki-mvp/design.md), [current workflow design and which earlier requirements it replaces](../../openspec/changes/commute-wiki-operating-loop/design.md), [record of the files installed in the live Project](../../chatgpt-project/README.md), [experiment log](../commute-experiment-log.md), classifier types/validator, routing implementation, current queue-generation instructions and schemas.
- Historical local research archive was read, not copied: `codex-docs/tldr-interest-profile-session-state.md`; `codex-docs/schema/tldr-holdout-comparison.md`; `codex-docs/schema/tldr-fresh-holdout-comparison-two-axis.md`; `codex-docs/schema/tldr-fresh-holdout-comparison-two-axis-calibration-v2.md`. These paths are relative to the parent research workspace and are not public repository dependencies. The requirements summarize the findings; raw labels and private research text remain outside Git.

## Clarification during PR review

Brad specified the two-file design during review of PR #126: a main JSON file
containing only `sweep_playback` and `items[].item_playback`, with every other
field moved to a matching `-reference` file. Voice opens only the main file at
start and reads the reference only for requested article details. R9 and P10 now
state this design explicitly, including how export preserves the full queue.
This is additional user direction after the original issue review; the issue
and comment counts above remain the original snapshot.

## Gmail feasibility check

Read-only ID searches returned 85 candidates for `in:trash from:(tldrnewsletter.com) after:2026/08/01 before:2026/09/06`, and 10 for `in:anywhere from:(tldrnewsletter.com) after:2026/07/27 before:2026/07/30`, both without another page. These are message-search candidates, not counts of newsletters or articles confirmed by reading the emails. No message bodies were read or saved, and no mailbox state was changed. This inventory does not establish which July 28 editions are recoverable or which messages are unused material suitable for the final test.

Gmail removes messages after 30 days in Trash, measured from deletion rather than delivery. Recovery should therefore start with extracting article data without saving private email details, not wait until the four-week experiment ends. See [Gmail deletion policy](https://support.google.com/mail/answer/7401). A future program using the Gmail API must explicitly include Trash using `includeSpamTrash`; see [messages.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list).

## Reading order

1. [Requirements and feedback findings](requirements.md)
2. [PR sequence and testing plan](implementation-plan.md)
