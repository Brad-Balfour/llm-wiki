# OpenSpec retirement inventory

Issue [#135](https://github.com/Brad-Balfour/llm-wiki/issues/135) removed the
repository's OpenSpec layer. This compact inventory records the pre-deletion
review. Exact current contracts remain in the named stable owners; this file is
an audit map, not a replacement specification.

## Classification method and conflicts

Every proposal, design, task list, and capability file under the three change
folders was reviewed. Requirement/scenario text was classified with its heading;
design rationale with its numbered decision or section; and work with its task.
Repeated scenarios and completed tasks are implementation history. Current rules
move only when their stable owner did not already contain them.

The review found three kinds of drift. Queue-v2/v3 defaults were superseded by
the deployed v4 pair; old handoff/compiler and approval-record language was
superseded by direct PR maintenance; and optional local classifier/producer work
was never accepted as current behavior. Current schemas, tests, prompts, recent
accepted plans, and observed behavior therefore win over those older statements.

## File-by-file disposition

| Removed files                                                                                                                       | Statements reviewed                                                                                                                                                                                     | Classification and final owner                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap-llm-wiki-mvp/proposal.md`, `design.md`                                                                                   | TLDR-only scope; score-first/source-neutral classification; separated profile/classifier/routing; file-first queue, feedback, wiki, and Pages choices; provider adapter and UI ideas; privacy non-goals | Current boundaries: `AGENTS.md`, `README.md`, `schema/`, `src/`, tests, and `docs/decisions/commute-system-boundaries.md`. Optional adapters/UI remain history or existing issues. Completed setup is Git/PR history.                          |
| `bootstrap-llm-wiki-mvp/specs/tldr-ingestion/spec.md`                                                                               | Manual input, confirmed Gmail body, non-sponsor extraction, sanitized stable identity, holdout accounting, fail-closed parsing                                                                          | Current: `src/tldr/`, parser tests, `README.md`, and `AGENTS.md`. Holdout/calibration planning: issues #35, #66, and #68.                                                                                                                      |
| `bootstrap-llm-wiki-mvp/specs/classifier-routing/spec.md`                                                                           | Verified attribution, split profile files, source-neutral output, fail-closed validation, application routing, provider-neutral runtime, product-harm measures                                          | Current: `schema/interest-profile.md`, `schema/classifier-instructions.md`, `schema/routing-rules.md`, `src/classifier/`, `src/routing/`, and focused tests. Optional local provider runtime: #35/#68.                                         |
| `bootstrap-llm-wiki-mvp/specs/commute-queue/spec.md`                                                                                | v4 playback/reference split and provenance; prepared context; queue order/modes; manual Voice/Tesla validation; notes/evidence; Project adapter                                                         | Current v4: queue schemas, `chatgpt-project/`, queue/session tests, and classifier-v2 requirements. Older v2/v3 generation defaults are historical; compatibility remains in validators/tests.                                                 |
| `bootstrap-llm-wiki-mvp/specs/feedback-labels/spec.md`                                                                              | Exact structured labels, correction types, cadence, future consumption, blind validation, harm review, sensitive handling                                                                               | Current storage: feedback schema/source/tests and `AGENTS.md`. Future measured consumption/reporting: #35, #66, and #68.                                                                                                                       |
| `bootstrap-llm-wiki-mvp/tasks.md`                                                                                                   | 46 completed implementation tasks plus local classifier/producer, label consumption, scheduling, deferred products, and quality gates                                                                   | Completed work: Git/PR history. Local classifier/producer and label consumption: #35/#68. Scheduled reliability: #37. Deferred products remain non-goals until a focused issue accepts them. Standing quality rules moved to `AGENTS.md`.      |
| `commute-wiki-operating-loop/proposal.md`, `design.md`                                                                              | Goals/non-goals; 14 numbered evidence, Voice, import, maintenance, safety, and reliability decisions; journey, compatibility, artifact, migration, and failure-driven maps                              | Current boundaries retained in `docs/decisions/commute-system-boundaries.md`; exact behavior is owned by session/queue schemas, `src/commute/`, `src/wiki/`, prompts, tests, and runbooks. Historical rollout questions remain in Git history. |
| `commute-wiki-operating-loop/specs/queue-selection/spec.md`, `voice-session/spec.md`, `scheduled-queue-output/spec.md`              | v4 startup, lookup/recovery, cursor and reopen rules, literal/prefetch behavior, complete scheduled pairs, duplicate reconciliation, observable delivery, no archive fallback                           | Current: `chatgpt-project/`, v4 schemas, prompt/queue tests, and issue #37 for remaining scheduled reliability.                                                                                                                                |
| `commute-wiki-operating-loop/specs/session-bundle/spec.md`, `commute-import/spec.md`                                                | self-contained snapshots/bundles, delivery and naming, exact binding, recovery/integrity/event order, multi-bundle import, partial evidence, naming recovery, maintenance results                       | Current: session schema, `src/commute/`, fixtures/tests, and `chatgpt-project/session-export.md`.                                                                                                                                              |
| `commute-wiki-operating-loop/specs/wiki-maintenance/spec.md`                                                                        | one-command, existing-wiki-aware, source-retrieved, discussion-bound direct PR maintenance and public safeguards                                                                                        | Current: `src/wiki/`, wiki schemas/content, maintainer tests, `docs/wiki-maintainer-pr-review.md`, and `AGENTS.md`.                                                                                                                            |
| `commute-wiki-operating-loop/tasks.md`                                                                                              | completed rollout/import/maintenance work; journey review; recurring review separation; measured classifier report                                                                                      | Completed work and journey rollout are history. Planning/review rules are in `AGENTS.md`; classifier report is #66/#68.                                                                                                                        |
| `pre-render-queue-playback-text/proposal.md`, `design.md`, `specs/commute-queue/spec.md`, `specs/voice-session/spec.md`, `tasks.md` | exact item/sweep rendering, attribution, queue-boundary rename, v2 compatibility, coupled trial; later v4 minimal main file and context                                                                 | Current: v3/v4 schemas, validators, generation/Voice prompts, classifier-v2 requirements, and queue/prompt tests. v3 promotion work is superseded by v4; the real Voice concern continues in #100 and #153.                                    |

## Unfinished-task disposition

- Local provider-neutral classifier, local queue producer, persisted local runs,
  and label consumption: intentional future decisions in #35 and #68; #66 owns
  the prerequisite corpus and measured report.
- New unseen final check and measured high-harm review: #66 and #68.
- Scheduled nightly reliability: #37. Secret handling remains a standing rule in
  `AGENTS.md`. RSS, YouTube, Cloudflare, custom realtime Voice, UI, and ensemble
  ideas were optional/deferred and were not promoted into new issues here.
- Journey non-regression remains a constraint in the focused runbooks and tests.
  The former mandatory three-review and pre-PR reviewer checklists are
  superseded by `AGENTS.md`'s current risk-proportional validation and latest-head
  review policy; they are not product backlog items.
- The v3 long-session trial is superseded by v4 deployment. Current Voice
  playback investigations are #100 and #153.

No new issue was necessary: every still-intended item already has an owner, and
the remaining unchecked items were standing rules, conditional ideas, or
superseded rollout work.
