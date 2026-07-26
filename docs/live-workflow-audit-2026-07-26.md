# Live Workflow And OpenSpec Audit — 2026-07-26

This audit reconciles the active plans with the signed-in ChatGPT Project,
scheduled conversation, Project settings, Project sources, recent commute
conversations, Task Update emails, repository implementation, and tests. Its
purpose is to preserve the working product path and prevent old unchecked tasks
from being treated as automatic implementation instructions.

## Confirmed Live Configuration

### LLM-Wiki-Car Project

- The live Project instructions are Prompt Revision 3.0. After ignoring the
  Markdown fence-only lines that the Project settings field omits, the live
  text is semantically identical to
  `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md`.
- The six expected live sources are present:
  - `queue-generation-v2(1).md`
  - `tldr-commute-queue-v2.schema(1).json`
  - `commute-session-bundle-v1.schema(1).json`
  - `classifier-instructions(2).md`
  - `routing-rules(1).md`
  - `interest-profile.md`
- The numeric suffixes are ChatGPT Library upload suffixes, not competing
  contracts.

### Weekday TLDR Queues Task

- Status: active; the editor exposes **Pause**, not Resume.
- Schedule: Monday through Friday at 11:00 AM, with no end date. The managed
  prompt applies America/New_York when deriving source-email delivery dates.
- The live prompt body exactly matches the managed body in
  `chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2.md`, including the example
  v2 object.
- The editor reported its latest run as July 24 at 11:08 AM.
- The prompt still references the Project's v2 instructions and attached queue
  schema. It is largely self-contained, but it is not independent of those
  Project sources.

## Scheduled Failure Timeline

| Run               | Gmail result                        | Artifact result                        | Observable evidence                                                                                                                                                  |
| ----------------- | ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| July 20, 11:12 AM | Four TLDR editions found            | Four real queue artifacts were created | The scheduled conversation exposes General, Dev, AI, and Fintech downloads. It then incorrectly said the recurring task had been disabled because the run succeeded. |
| July 21, 11:03 AM | General, Dev, and AI found          | All file-generation paths failed       | The conversation and the 11:06 AM Task Update report `ClientError Encountered exception: <class 'oai_http_clients.client.ClientError'>`.                             |
| July 22, 11:03 AM | General, Dev, and AI found          | Both file-generation paths failed      | The 11:04 AM Task Update reports the same `ClientError`.                                                                                                             |
| July 23, 11:04 AM | General, Dev, AI, and Fintech found | Every file-writing path failed         | The 11:04 AM Task Update reports the same `ClientError`.                                                                                                             |
| July 24, 11:08 AM | General, Dev, and AI found          | Every file-writing path failed         | The scheduled conversation and Task Update report the same `ClientError`.                                                                                            |

The failure emails contain no attachments or additional stack/status details.
They do prove that background Gmail search completed and found the expected
messages before artifact generation failed.

## Manual Control And Diagnosis

At 2:42 PM on July 24, a manual chat in the same `LLM-Wiki-Car` Project used
the uploaded v2 queue-generation instructions and schema to find that day's
Gmail messages. It created three real downloads:

- `20260724-tldr.txt`
- `20260724-tldr-dev.txt`
- `20260724-tldr-ai.txt`

This manual success occurred on the same day that the scheduled run found the
same three editions and failed to write every artifact. The most evidence-based
diagnosis is therefore:

1. Gmail connector discovery is working in scheduled execution.
2. The queue contract, live v2 sources, and manual Project generation path are
   working.
3. The July 21-24 defect is isolated to the scheduled/background
   artifact-generation boundary.
4. The repeated generic `oai_http_clients.client.ClientError` is platform-side
   evidence, not enough information to name a lower-level service or status
   code.
5. The July 20 “disabled because successful” message is a separate suspicious
   Task lifecycle event and may be related, but the available evidence does not
   prove causation.

The current OpenAI help text says a Task created in a Project with files cannot
access those Project files. The word “access” does not document whether the
restriction is read-only or also prohibits writing new artifacts. Historical
behavior demonstrates that this Task could create Project/Library-visible
artifacts on July 20, while the July 21-24 runs failed only after Gmail
discovery. The documentation is therefore relevant platform context, but it
does not by itself explain the observed `ClientError`.

Do not rewrite queue logic to address this evidence. Keep issue #37 focused on
the scheduled execution/artifact boundary, Task lifecycle, and observable
platform behavior. The manual Project generation chat is the accepted control
and fallback until scheduled output again proves reliable.

## Working Non-Regression Baseline

The observed product loop is:

```text
manual Project queue generation (scheduled when it works)
-> downloadable v2 queue
-> one named queue per Voice chat
-> explicit downloadable session bundle
-> Brad supplies original queue(s) and bundle(s) to a maintenance/debug chat
-> the agent invokes repository validation/import/maintenance scripts
-> useful wiki branch/PR or an observable no-change result
```

Recent July 24-25 conversations prove the following:

- Prompt 3.0 is live and one-queue playback remains the accepted car model.
- Dev and AI bundles exported on the first attempt.
- General initially violated the automatic queue-recovery instruction, then
  recovered the exact queue and created a bundle containing a quality incident.
- Playback/product failures and classifier corrections are distinct evidence.
- The user-facing home operation is a chat request with supplied artifacts.
  Package scripts are implementation tools the agent invokes; Brad does not
  need a newly consolidated human-facing CLI.

No plan task may replace this loop merely because an older implementation idea
remains unchecked. A replacement needs comparative evidence, focused
regression tests, and an explicit default/fallback decision.

## Remaining-Work Matrix

| Area                                           | Complete/live                                                                                                       | Genuinely remaining                                                                                            | Decision or non-regression rule                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Operating-loop 0.x                             | Historical/live evidence, compatibility audit, and first bundle-version questions are resolved                      | Explicit acceptance/revision of the six journey rows; recurring adversarial review for future behavior changes | Review against the working baseline; do not restore an old flow to satisfy a planning checkbox.                                          |
| Session contract 1.x                           | Bundle schema, exact/unresolved distinction, importer, real July 24 bundles, playback/filename regression coverage  | No known v1 contract gap; add future guards only when new observed failures justify them                       | Add guards around observed failures without changing the working artifact shape.                                                         |
| Live Project 2.x                               | Prompt 3.0 live, six sources live, v2 Task prompt live, real-car tests                                              | Scheduled artifact reliability under issue #37                                                                 | Cutover is verified. A failed scheduler does not make the live Voice prompt unverified.                                                  |
| Home intake 3.x                                | Validation, multi-bundle import, fail-soft feedback/incident persistence, retryable outcomes, and contract fixtures | No known 3.x gap; add future guards only when new observed failures justify them                               | “Reconciliation” means validating supplied session bundles against their queue snapshots, not combining commute conversations or queues. |
| Wiki maintenance 4.x                           | Source boundary, maintainer implementation, chat-mediated workflow, outcome fixtures, and PR review guidance        | Review early real maintainer PRs before considering any auto-merge policy                                      | Keep package scripts as agent-invoked internals. No separate command-consolidation project is needed.                                    |
| Product reliability 5.1                        | Private quality incidents and remedy triage                                                                         | Continued incident fixtures and platform documentation as failures occur                                       | Includes playback, queue discovery, bundle output, and scheduled artifact failures; excludes classifier learning.                        |
| Classifier calibration 5.2-5.3 / bootstrap 6.x | Exact identity policy and cadence policy                                                                            | Dedicated correction-label storage, measured report, next-run context workflow, and tests                      | Only item-bound interest/depth/routing corrections enter this loop.                                                                      |
| Bootstrap classifier 4.x                       | Structured validation, source-neutral quarantine, deterministic routing                                             | Optional provider adapter, model batching, and classification-run persistence                                  | Decide whether local execution is needed as fallback/control/default before building it.                                                 |
| Bootstrap queue 5.1-5.3                        | Live/manual v2 production, schema, validation, duplicate policy, real commute use                                   | Optional deterministic local producer                                                                          | Compare it with the working Project producer and issue #37 outcome before implementation.                                                |

## Immediate Focus

1. Preserve the manual July 24 control as the operational fallback.
2. Keep issue #37 scoped to scheduled/background artifact generation and the
   anomalous July 20 Task-disable message.
3. Review early real maintainer PRs with the committed 4.3 checklist; do not
   infer an auto-merge subset from fixture coverage.
4. Implement classifier-label storage only when it is explicitly treated as
   classifier correction data, separate from the product reliability loop.
5. Decide whether local classifier/queue execution is warranted after the
   scheduler diagnosis; do not assume the original bootstrap sequence is still
   the product roadmap.
