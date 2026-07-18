## Context

This is a product operating-loop design, not a prompt rewrite. ChatGPT Tasks,
Projects, Library, Voice, and connectors are external product surfaces with
observed behavior that can change. The repository owns the durable contracts,
local reconciliation, fixtures, source retrieval, and wiki maintenance.

The observed, working queue-generation path is:

```text
Gmail connector -> scheduled ChatGPT Task -> downloadable dated .txt queues
-> LLM-Wiki-Car Project Library
```

The observed weaknesses begin after a queue is loaded into a long Voice
conversation. In particular, the model's statement that it wrote, retained, or
loaded a file is not evidence that this occurred.

## Goals / Non-Goals

**Goals:**

- Keep the successful scheduled queue path simple and observable.
- Make every item-specific Voice event bind to an exact current queue item or
  explicitly remain unresolved.
- Make one queue/one Voice chat practical enough to test in real traffic.
- Ensure the home workflow can import several session bundles together without
  manual data assembly.
- Make saved source URLs useful to a maintainer that reads the existing wiki.
- Turn real commute defects and feedback into durable regression and calibration
  inputs.

**Non-Goals:**

- Guarantee that ChatGPT Voice retains context across restarts or platform
  revisions.
- Make ChatGPT Library a transactional or append-only event store.
- Require Brad to manage approval, authorization, or provenance vocabulary
  during a commute.
- Collapse all newsletter queues into one conversation merely to reduce the
  number of artifacts.

## Decisions

### 1. One active queue per Voice session is the provisional car model

A text chat explicitly loads one named queue. Voice begins from that chat and
uses that queue only. Switching newsletters starts a new text chat and a new
Voice session. Each such session produces its own self-contained bundle.

This is an intentionally testable constraint, not a permanent product choice.
If repeated real commutes show the switch is too awkward, or the platform gains
reliable attachment/session behavior, a later change may replace it without
weakening item identity or local import contracts.

### 2. The final bundle, not a live ledger, is the import boundary

A live ledger can be helpful working evidence, but it is not assumed to have
been appended correctly. The final `commute-session-bundle` carries the queue
snapshot necessary to interpret its events, completion state, captures,
feedback, and incidents. Its integrity declaration states whether it came from
complete current-session evidence, partial evidence plus recovery, or an
unresolved capture.

No user-facing workflow waits for an agent to call an event "approved" or
"authorized." The local importer validates shape and references because that
prevents false association, not because it creates a new permission gate.

### 3. Unresolved information is data, not a reason to fabricate or refuse

If the active item cannot be verified, the bundle stores an
`unresolved_capture` with the spoken/requested text and recovery clues. It does
not create an item-specific feedback or wiki capture with guessed title, URL,
or identifier. The importer reports unresolved captures plainly and retains
them for recovery.

### 4. Multiple bundles are one home operation

One local import command accepts one or more selected session bundles. It
reconciles each against its embedded queue snapshot, retains per-session
integrity results, and creates one maintenance input set. Brad therefore does
not combine queues, ledgers, handoffs, or reconstructed notes manually.

### 5. The maintainer is a change-deciding wiki reader

For every saved source, the maintainer retrieves the URL when feasible and
reads relevant existing wiki pages. It decides whether to create, update,
reorganize, or interlink pages, then writes one inspectable PR. A PR is the
ordinary reversible review point; there is no extra before-write confirmation
for routine knowledge maintenance.

### 6. Product reliability and classifier calibration are separate loops

An invented headline, lost queue, failed file write, audio outage, or wrong
event binding is a quality incident. It is triaged to one of: Project
instructions/reference material, deterministic local tooling, or a documented
platform limitation. It becomes a regression fixture when deterministic.

Classifier feedback is separate: it is valid only when tied to the exact item
at the time Brad gave it. Repeated corrections, skips, and depth changes inform
the classifier/profile on a measured cadence; they are not prompt edits after
every commute.

## Journey Contract

The following table is the source-of-truth product map. Each row is a boundary,
not a claim that every action is implemented in repository code.

| ID  | Boundary                                    | Input                                                                         | Success outcome and proof                                                                                                                                                | Failure outcome                                                                                                                         | Must never be guessed                                                                              | Owner                                        |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| J1  | Scheduled Task -> Project Library queue     | Direct TLDR messages delivered today and the Task prompt                      | One real, parseable, dated `.txt` queue per source email is downloadable and present in the `LLM-Wiki-Car` Library. The Task Update and artifact contents are the proof. | State which expected queue is absent or invalid; create no filename-only placeholder and do not use Drive or another storage connector. | That a scheduler's “last ran” status proves a usable queue exists.                                 | Task prompt + manual acceptance record       |
| J2  | Project Library -> selected text chat       | One explicitly named queue file                                               | Text chat confirms the exact filename and loads that queue. The attached/selected filename is the proof.                                                                 | Stop selection; ask for or display the available named queues before Voice starts.                                                      | A queue chosen from conversational recollection or a similarly dated filename.                     | Project instructions                         |
| J3  | Selected text chat -> Voice session         | Selected queue and current session start                                      | Voice uses that queue only, begins at a known first item, and no prefetch advances the cursor. A session header records the queue filename and identity.                 | End or restart the session when the queue cannot be verified; selecting another queue means a new session.                              | Queue position, item identity, or prior chat attachments after a restart.                          | Project instructions + session contract      |
| J4  | Voice session -> session bundle             | Current queue snapshot, explicit user actions, and available session evidence | One self-contained bundle records exact captures, feedback, progress, quality incidents, and integrity/recovery state.                                                   | Emit a partial/recovery bundle with unresolved captures; do not pretend the log is complete.                                            | Item IDs, titles, URLs, feedback targets, or ledger completeness.                                  | Session-bundle schema + Project instructions |
| J5  | One or more bundles -> local reconciliation | Selected bundle files                                                         | One local command validates/reconciles each bundle and returns one consolidated maintenance input set with per-session results.                                          | Retain and report failed or unresolved records without discarding valid sessions.                                                       | That separate bundle events refer to the same queue/session, or that a reconstruction is complete. | Deterministic local importer                 |
| J6  | Reconciled inputs -> wiki-maintainer PR     | Saved URLs, captures, feedback context, and existing wiki                     | Maintainer retrieves feasible sources, reads relevant wiki pages, and opens one PR containing useful page/link changes. The PR diff is the proof.                        | Report inaccessible or insufficient sources and leave a traceable maintenance item for later recovery.                                  | That a queue summary is the full source, or that every source deserves a new page.                 | Source retrieval + wiki maintainer           |

## Requirement and Artifact Map

| Journey ID | OpenSpec capability      | Primary durable artifact                  | Acceptance evidence                               |
| ---------- | ------------------------ | ----------------------------------------- | ------------------------------------------------- |
| J1         | `scheduled-queue-output` | Task prompt and real queue files          | Manual Task run record plus parse/preflight check |
| J2         | `queue-selection`        | Selected queue/session header             | Manual text-chat selection check                  |
| J3         | `voice-session`          | Voice session state                       | Real-car smoke test and restart fixture           |
| J4         | `session-bundle`         | Versioned bundle schema and fixture files | Schema validation and recovery fixtures           |
| J5         | `commute-import`         | Private normalized import record          | One-command multi-bundle fixture import           |
| J6         | `wiki-maintenance`       | Branch/PR and wiki/source changes         | PR diff reviewed against retrieved sources        |

## Failure-Driven Change Rule

Every real commute failure is recorded with the boundary it crossed, observed
evidence, product harm, and likely remedy category. A follow-on change is not
complete until it supplies the smallest durable guard that would have detected
the same failure earlier: a fixture, a local validator, a project-instruction
example, or a documented platform limitation.

## Migration Plan

1. Agree this journey contract and the six boundary specs.
2. Define `commute-session-bundle` schema and local import behavior while
   retaining v1/v2 handoff import compatibility.
3. Add fixtures from observed defects before revising Project instructions.
4. Update the Project instruction/reference files to implement J2-J4.
5. Implement local reconciliation, source retrieval, and maintainer PR flow.
6. Add feedback aggregation and quality-incident triage after the event
   contract is proven in real sessions.

## Open Questions

- What smallest spoken/text interaction reliably creates a final bundle in
  ChatGPT Voice without falsely claiming that it wrote an ongoing ledger?
- Can a new Voice session start from a text chat's selected queue consistently
  enough on the phone surface?
- What exact source-retrieval fallbacks are sufficient for JavaScript-heavy or
  paywalled article URLs?
- What cadence and evaluation set should gate classifier/profile changes?
- Which low-risk maintenance PRs, if any, may eventually auto-merge after bot
  review and observed human review quality?
