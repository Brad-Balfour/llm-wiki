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

### 7. Content safeguards are not user-facing approval gates

Saying `wiki this` is sufficient to create an exact maintenance capture. The
maintainer may retrieve its source and write a PR without asking Brad to approve
an intermediate source record, confirm a public flag, or supply a second spoken
command.

The repository still protects against raw Gmail bodies, credentials, private
work notes, and unsafe rendered content. Those are content-validation and
redaction rules, not a second user decision. When a safeguard blocks a detail,
the maintainer omits or sanitizes that detail and reports the limitation in its
result; it does not turn ordinary knowledge maintenance into approval ceremony.
The normal human decision point is the Git PR review and merge, with a later
option to auto-merge a proven low-risk subset.

### 8. Platform claims require external evidence

ChatGPT prose, a spoken confirmation, or a scheduler's `Last ran` label is not
proof of an artifact or active queue state. Each boundary therefore has a
defined observable proxy and, where possible, a deterministic local check.
Those checks reduce risk; they do not promise that the platform retains state
between turns.

For queue selection, the operator verifies that the exact queue file is visibly
attached to the _current_ text chat and performs a selection challenge against
the file, such as matching its filename and first canonical item identity. This
is a smoke-test proxy for the later Voice session, not proof that a future turn
will retain the attachment. For session-bundle delivery, the proof is a visible
download link/Library object followed by local schema and content validation.

### 9. A Voice restart is terminal unless a bundle proves otherwise

Voice pause, freeze, or restart SHALL not imply durable continuation. If the
platform creates a new chat or the selected queue cannot be verified, the prior
session is terminal. A final bundle is attempted only when the end-of-session
artifact can be created; otherwise the session has an explicit missing-artifact
result. The next session starts from a fresh text-chat selection and may replay
from a known item; it never claims a remembered resume position.

### 10. Bundle delivery has an explicit recovery hierarchy

1. A successful session has one identifiable downloadable bundle artifact that
   is visible in the current chat/Library and later validates locally.
2. If the artifact is created but contains partial evidence, it declares the
   evidence sources and affected unresolved captures.
3. If artifact creation fails, the chat reports `session export failed: no
downloadable bundle was created`; it does not claim a ledger, reconstruction,
   or importable handoff exists.

The third outcome is a product-quality failure. It may later be investigated
from a user-provided chat link or UI evidence, but it cannot be promoted into
exact item-specific events from conversational memory.

### 11. Integrity is evidence coverage, not model confidence

Every bundle event records its available evidence source. The allowed sources
are: a durable contemporaneous event record, the literal selected queue
snapshot, a final explicit user capture, and a user-provided chat/UI
observation. An event may cite more than one source.

`complete` is allowed only when a durable contemporaneous event record covers
every claimed action from session start through end. A final bundle assembled
without that record is `partial`, even if its individual captures look
plausible. `recovered` means some records were reconstructed from declared,
incomplete evidence; it never implies complete event coverage. The importer
rejects a `complete` declaration that lacks the required evidence coverage.

### 12. Event ordering is required for exact action binding

The bundle records a monotonic sequence of queue states and actions. An
item-specific action is valid only after that exact item has been announced as
current and before a later action advances, interrupts, or replaces it. `next`,
skip, repeat, interrupted discussion, and duplicate speech recognition all
produce explicit transitions or an unresolved capture. This is a structural
guard against attaching feedback to any real-but-wrong item in the snapshot.

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

Only an exact `wiki this` capture nominates a source for J6. General saves,
classifier corrections, skips, and quality incidents do not silently become
wiki maintenance input. The maintainer may conclude that a nominated source
does not justify a change; that outcome is recorded as a no-change or
insufficient-source maintenance result rather than a fabricated PR.

## Compatibility And Supersession Map

This change is a proposed successor to parts of
`bootstrap-llm-wiki-mvp`. The statuses below are deliberately specific:

- **Retained unchanged**: the requirement remains the intended contract.
- **Retained, revised here**: keep the goal, but this change replaces its
  behavior or sequencing.
- **Legacy compatibility only**: existing code/artifacts remain usable during
  migration, but new work does not extend that path.
- **Historical record**: useful evidence, not an active operating instruction.

| Existing material                                                                                                              | Status                                | Governing direction after this change is accepted                                                                                                                    | Migration point                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TLDR parsing, sanitized source records, stable source identity, classifier source-neutrality, queue ordering and item metadata | Retained unchanged                    | Bootstrap requirements remain applicable.                                                                                                                            | No migration beyond normal maintenance.                                                                                                                     |
| Manual ChatGPT Voice before a custom voice agent; phone/Tesla-compatible car validation                                        | Retained, revised here                | J2 and J3 add explicit selected-queue and one-queue-per-session rules.                                                                                               | Project instructions change in tasks 2.1-2.2.                                                                                                               |
| Voice notes/corrections and queue usage evidence                                                                               | Retained, revised here                | J4 requires exact item binding or `unresolved_capture`; quality incidents become first-class data.                                                                   | Session-bundle schema and fixtures in tasks 1.1-1.4.                                                                                                        |
| `commute-handoff.v2`, a live append-only Library ledger, current-pass reconstruction, and one handoff for every loaded queue   | Superseded for new sessions           | J4 uses a self-contained session bundle with an explicit integrity/recovery declaration.                                                                             | v1/v2 import stays compatible until bundle import succeeds in real use.                                                                                     |
| Bootstrap task 5.7a and the single-handoff portion of task 5.8                                                                 | Superseded for new work               | J4/J5 replace the ledger and single-file assumptions; task 5.8 evidence is not claimed from a reconstructed artifact.                                                | Mark superseded when tasks 1-3 of this change pass.                                                                                                         |
| Feedback labels as durable data, cadence-based classifier updates, and private-data handling                                   | Retained, revised here                | Exact in-session binding is a prerequisite; only repeated, measurable corrections affect classifier/profile work.                                                    | Tasks 3.3 and 5.1-5.3.                                                                                                                                      |
| Existing compiler implementation, safe rendering, source-link preservation, and Pages read path                                | Legacy compatibility only             | Existing code remains usable while J6 is built; its safety checks remain valuable.                                                                                   | Do not remove until direct maintainer PRs work for fixtures and real sources.                                                                               |
| Bootstrap `approved source`, `public: true`, and local `--confirm-public` gates                                                | Superseded for new maintenance work   | `wiki this` creates a maintenance capture; safeguards validate content and the maintainer writes a PR directly. Git review/merge is the normal human decision point. | Replace as the default only after tasks 3-4 complete and early PRs are reviewed.                                                                            |
| `docs/commute-voice-handoff.md` and `chatgpt-project/commute-session-*.md`                                                     | Current legacy operating instructions | They remain usable until replacement instructions and bundle support pass real-car tests.                                                                            | Replace in task 2.4/5.4; do not label obsolete prematurely.                                                                                                 |
| `chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md` and `chatgpt-project/wiki-ingestion.md`                                          | Current legacy operating instructions | Their live-ledger and “Approve this” command paths do not govern successor work.                                                                                     | Replace after J2-J6 acceptance; retain only while legacy v1/v2 operation remains the runtime default.                                                       |
| `docs/replan-2026-07-12.md` and `docs/next-session-handoff.md`                                                                 | Historical record                     | They are not current plans. Evidence needed from them is summarized in `docs/commute-wiki-replan-2026-07-16.md` and this change.                                     | Remove from the working documentation set or move to a clearly marked history location after link/reference audit. Git history remains the durable archive. |

### Requirement Disposition Detail

| Bootstrap requirement or artifact                                                                                                 | Precise disposition                 | Successor requirement or retained rule                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commute-queue`: Prepared Commute Queue, Queue Priority Order, Required Item Metadata                                             | Retained unchanged                  | Existing queue contract remains the input to J1-J4.                                                                                                                                                                   |
| `commute-queue`: Manual Voice Review First, Tesla-Compatible Voice Validation                                                     | Retained with narrowing             | `queue-selection` and `voice-session` add one explicitly selected queue and terminal restart semantics.                                                                                                               |
| `commute-queue`: Voice Notes Route To Review, Queue Usage Evidence                                                                | Retained with narrowing             | Sensitive freeform content stays protected; a verified wiki request now becomes J6 input without promotion/approval. `wiki this`, `add this to my wiki`, and `save this for the wiki` are equivalent capture phrases. |
| `commute-queue`: Structured Post-Commute Handoff, including live ledger append, reload, all-loaded-queues state, and v2 creation  | Superseded for new Project behavior | `session-bundle` and `commute-import`; v1/v2 remain legacy import compatibility only.                                                                                                                                 |
| `feedback-labels`: label storage, cadence, product-harm review                                                                    | Retained with narrowing             | Exact verified binding is required before a correction is a label; unbound captures are not classifier data.                                                                                                          |
| `wiki-compilation`: safe rendering, HTTP(S)/credential checks, source-link traceability, idempotence                              | Retained as mechanical safeguards   | Applied by the maintainer path without an approval ritual.                                                                                                                                                            |
| `wiki-compilation`: Approved Sources Compile, Review Before Public Promotion, local `--confirm-public`; `approved-wiki-source-v1` | Superseded for new maintenance work | Exact `wiki this` -> importer maintenance input -> direct maintainer branch/PR. No `approved`, `public`, `reviewed_by`, or confirmation field is required before the PR.                                              |
| Existing compiler and v1/v2 importer                                                                                              | Legacy compatibility only           | Retain until J4-J6 acceptance criteria pass; no new Project instructions extend these paths.                                                                                                                          |

### Public-Content Boundary

Private Range.com content is always excluded from public wiki output. For a
public article with uncertain reuse rights, the maintainer links the source and
uses concise original synthesis rather than copied article text. If it cannot
support that synthesis without reproducing protected text, it records a
no-change or insufficient-source result. This is automatic content policy, not
a request for Brad to supply a new approval.

### Default-Change Criteria

The direct maintainer-to-PR workflow becomes the default when all of the
following are true:

1. session-bundle validation and multi-bundle import pass their focused
   fixtures;
2. a real-car J2-J4 test passes queue selection, terminal restart handling, and
   observable final-bundle delivery;
3. one real saved source is retrieved and produces a useful maintainer PR;
4. the PR's source handling, page changes, and links are reviewed against the
   retrieved material; and
5. replacement operator instructions are published in the Project source
   bundle.

At that point, update `AGENTS.md` and the active operator documentation to name
this change as the governing commute/wiki contract. Keep legacy importer support
only for pre-migration artifacts, then archive/consolidate the bootstrap change
through the normal OpenSpec workflow.

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
7. After the default-change criteria pass, update active repository guidance and
   replace or remove stale historical operating documents.

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
