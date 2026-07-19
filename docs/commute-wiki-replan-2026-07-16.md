# Commute-to-Wiki Replan Handoff

Date: 2026-07-16

Status: planning record for the next design session. It records observed
behavior and product decisions; it does **not** change the active OpenSpec
contract by itself.

## Product Direction

The product is a personal, evolving knowledge system. GitHub Pages is the
current primary reading surface. A commute is a high-value input interaction:
Brad hears a curated queue, skips or explores items, corrects classifications,
and marks useful ideas. Later, a local Mac process ingests that session and a
wiki maintainer can read the linked sources, improve existing pages, add pages
when useful, and create links across the wiki.

The desired outcome is not a feed that republishes newsletter headlines. It is
a maintained wiki that gets more useful as sources and feedback accumulate.

Raw newsletter material remains local for now because it is not useful to
operate on directly from the car. The nightly local workflow is therefore an
intentional bridge, not a permanent claim that raw material can never be used.

## Product Principles Decided So Far

- A URL in a queue is an instruction and opportunity to retrieve the actual
  source during local ingestion. A short queue summary is not the ceiling on
  what the wiki maintainer may learn.
- Do not make the user speak or manage terms such as "authorized," "approved,"
  or "provenance." Stable IDs, source URLs, timestamps, and validation remain
  useful internal plumbing, but are not user-facing permission gates.
- The maintainer may write a Git branch/PR directly. Git diff and PR review are
  the reversible inspection point; an extra confirmation step before ordinary
  linking and synthesis is not required.
- One successful commute must leave a single self-contained export sufficient
  for the local import. The user should not have to reconcile a queue file,
  ledger, handoff, and reconstructed notes by hand at home.
- There is no fixed, magic number of artifacts. The system needs the artifacts
  that make its three learning loops reliable, while keeping the car and home
  experiences simple.
- ChatGPT claims about a file, queue position, or previous action are not proof
  of that state. A visible/downloadable artifact and local validation are
  stronger evidence.

## The Three Connected Improvement Loops

### 1. Knowledge-maintenance loop

```text
Saved source URL + commute context
  -> local source retrieval and extraction
  -> wiki maintainer reads the existing wiki and source material
  -> creates/updates/interlinks pages in a PR
  -> merged wiki becomes the context for the next maintainer pass
```

The maintainer must be a _maintenance_ pass, not a compiler that maps each
source item to one isolated destination page. It should decide what changes
the current wiki needs after reading both the new material and relevant existing
pages. The initial PRs should be reviewed because the useful work includes
framing, synthesis, and relationship choices—not merely hyperlinks. Auto-merge
may become appropriate after the quality of those diffs is understood; a code
review bot alone cannot establish whether a subtle reframing is useful or
misleading.

### 2. Commute product-quality loop

```text
Observed failure or inconvenience in a real commute
  -> structured incident with enough evidence to reproduce
  -> classify the remedy:
       project instruction / project reference material / deterministic tool
  -> make and test the narrow change
  -> retain the example as a regression fixture
```

This is not an afterthought. Examples already collected include invented
headlines and URLs, a claimed queue position unsupported by the attached file,
Voice restarts that appear continuous on phone but split in the web sidebar,
and a claimed live ledger that contained only an initial header and first two
events.

The remedy should match the failure:

- Put stable behavioral guidance and examples in project instructions or
  reference files.
- Put repeatable parsing, validation, reconciliation, URL retrieval, and
  artifact inspection in deterministic local tools.
- Do not attempt to solve missing runtime state merely by writing increasingly
  strict prose prompts.

### 3. Classifier-calibration loop

```text
Exact current queue item + user feedback
  -> event bound immediately to that item's stable ID
  -> aggregate corrections and skips over time
  -> update the interest profile, examples, and/or classifier
  -> measure whether later queues improve
```

Feedback is only useful if it is attached to the active item at utterance time.
It must never be redirected to ChatGPT Memory and must not later be guessed
from topic memory. A concrete regression case: spoken disinterest in Kimi/open
source models was later recorded against a different Grok CLI queue item. That
is a binding failure, not a valid preference signal.

## Evidence From This Week

| Date / area                   | What worked                                                                                                                                                 | What failed or remains unknown                                                                                                                                                                                                          | Design consequence                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mon. commute                  | ChatGPT created a downloadable handoff, and downloaded artifacts were retained in the Project Library. Reattaching a queue restored grounded item playback. | Fresh/restarted Voice chats could lose the queue and invent content; the first handoff omitted stable IDs and URLs.                                                                                                                     | Queue snapshot/identity must travel with the session export; do not trust conversational recollection after a restart.                                        |
| Tue. commute                  | A corrected handoff could include stable IDs, URLs, and completion state.                                                                                   | The first handoff did not satisfy its own required shape. The ledger idea emerged because end-of-session reconstruction lost who said what.                                                                                             | Validate the export locally and preserve recovery evidence, but avoid treating an unverified reconstruction as a clean deterministic log.                     |
| Wed. morning                  | The project and queues could be loaded before driving.                                                                                                      | Voice again conflated or invented items and then used honesty/guardrail language as a reason not to create a recovery artifact.                                                                                                         | A partial session needs a valid recovery/bundle output, not the false choice between invented data and no output.                                             |
| Wed. evening                  | A real JSONL session-ledger file was created; source URLs could be retrieved later in the session; a later `-r2` handoff was created.                       | The ledger contains only the header plus the first two events, even though the assistant repeatedly claimed it was recording every action. The `-r2` handoff is an end reconstruction and contains the feedback misbinding noted above. | Treat append-to-Library as unproven. Represent ledger integrity explicitly and make unresolved captures recoverable rather than silently reconstructed.       |
| Thu. morning                  | Downloadable ledger artifacts can exist in the Library.                                                                                                     | The purported morning "live" ledger was actually created at 9:23 PM and contains only a late session skeleton; reconstruction introduced unsupported headlines/URLs.                                                                    | Timestamp and integrity checks must distinguish live events from later reconstruction.                                                                        |
| Scheduled queue task, Jul. 15 | The 11:04 AM Task emailed a real success notice, generated three dated queues, reported preflight, and the files appeared in the Project Library.           | —                                                                                                                                                                                                                                       | Scheduled Tasks can be a viable queue-generation path. Preserve this successful behavior as the acceptance test.                                              |
| Scheduled queue task, Jul. 16 | Scheduler UI reports that it ran at 11:02 AM.                                                                                                               | No corresponding email or expected dated files were observed. Earlier task output also included filename-shaped placeholder artifacts rather than a real regeneration.                                                                  | "Last ran" is scheduler telemetry, not a successful deliverable. Compare tomorrow's run to the Jul. 15 observable outcome before redesigning away from Tasks. |

## What Is Actually Known About ChatGPT Files and Voice

1. User-visible downloadable files can be real artifacts and can persist in the
   Project Library.
2. A Task can, at least sometimes, create those queue artifacts and email a
   useful completion notice.
3. A created download is a snapshot. Recreating a same-named file later does
   not prove an earlier download link now points at the newer contents.
4. A Voice restart may create a new chat from the web/sidebar perspective even
   when the phone interaction feels like one continuing drive.
5. Project/Library attachment availability is not a reliable substitute for
   verifying the actual active queue item on every meaningful capture.
6. The model's account of its own file access and writes has contradicted the
   visible artifacts. Design must tolerate that rather than argue with it.

The specific cause of files apparently leaving active attention later in a
Voice conversation is not yet diagnosed. Plausible explanations include a
missing attachment in the new continuation, degraded attention over a long
conversation, conflation of several loaded artifacts, or position tracking
from conversational memory rather than from the queue. The supplied share
transcripts are the evidence base for turning these hypotheses into regression
tests.

## Proposed Target Shape

The target needs two input/learning loops beside the wiki loop, not just a
larger handoff schema.

### A. Queue generation before the commute

The scheduled Task remains a convenience producer:

```text
Gmail newsletters -> classify/dedupe -> dated queues in Project Library
```

Its acceptance test is observable: Task Update email, dated Library files, and
real parseable queue contents. If tomorrow repeats the failure, compare the
current task prompt and task execution behavior with the known-good Jul. 15
run before changing architecture.

### B. One self-contained commute-session export

At the end of a drive, export one bundle that contains enough to ingest without
manually combining four sources. At a minimum it needs:

- session metadata and ChatGPT surface/restart boundaries when known;
- a snapshot of the relevant queue records (stable IDs, titles, URLs, section,
  and order);
- playback/resume state;
- knowledge-capture events such as "wiki this" with the exact active item;
- classifier-correction and interest-feedback events with the exact active
  item;
- quality incidents (e.g. missing queue, invented item, audio failure);
- an integrity/recovery declaration that says whether the events came from a
  complete live ledger, a partial ledger plus reconstruction, or a manually
  unresolved capture.

If the active identity cannot be resolved, the bundle should contain an
`unresolved_capture` with the user's words and recovery clues. It must not
invent an ID, use placeholder IDs, or claim a fully validated handoff.

The first practical implementation may use a session ledger plus a final
bundle, but the final export is the only artifact the user needs to carry home.
Whether ChatGPT can reliably maintain a mutable Library ledger is an empirical
question, not an assumption embedded in the design.

### C. Local reconciliation, retrieval, and maintenance

The local importer validates/reconciles the bundle, retrieves saved URLs, and
then invokes the wiki-maintainer workflow. The maintainer should receive the
new source material and relevant existing wiki pages, then make the smallest
useful set of page and link changes in a PR.

## Decision Boundaries for Future Work

Do not let concurrent agents rewrite these boundaries in overlapping changes.

| Workstream                           | Owns                                                                             | Must not silently change                                  |
| ------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Queue generation and classifier      | Newsletter parsing, classification output, queue records, preference aggregation | Commute event schema or wiki-writing semantics            |
| Commute/session import               | Session bundle, validation, reconciliation, incident capture                     | Classifier policy or public wiki presentation             |
| Source retrieval and wiki maintainer | Fetch/extract source content, read existing wiki, propose Markdown/link changes  | Queue identity generation or Voice behavior               |
| Project instructions/reference files | Car interaction wording, recovery behavior, examples                             | Deterministic validation rules that belong in local tools |

Before implementation begins, write an explicit revision proposal that names
the contracts each workstream may change. Small vertical slices are still
welcome—for example, importing one valid session bundle and producing a
maintainer PR—but they must not opportunistically redefine another workstream's
data model.

## Recommended Sequence

1. **Observe tomorrow's scheduled Task run.** Record whether the known-good
   acceptance signals occur. Do not assume today's missing output proves the
   Task integration is impossible.
2. **Write the planning revision.** Reconcile this document with the active
   OpenSpec change and choose the session-bundle/recovery contract before
   several agents modify adjacent files.
3. **Build a narrow import vertical slice.** A single valid self-contained
   commute bundle should reconcile locally, retrieve one saved URL, and produce
   a wiki-maintainer PR that can update/link existing knowledge.
4. **Add the quality-loop fixtures.** Use real failure examples: lost queue on
   continuation, invented article, partial ledger falsely claimed complete,
   feedback bound to the wrong item, and placeholder task output.
5. **Add classifier calibration deliberately.** Persist exact corrections,
   aggregate them, and change prompts/profile/tools based on measured patterns
   rather than one-off anecdotes.
6. **Revisit PR automation after observing maintainer diffs.** Review the
   first useful knowledge PRs for framing/link quality; then decide whether
   bot-review plus auto-merge is acceptable for a defined low-risk subset.

## Questions Still Open

- What exact project/task prompt edit or platform condition separated the
  working Jul. 15 scheduled queue run from the missing Jul. 16 output?
- Can a Voice conversation reliably append/revise one Library artifact over a
  whole drive, especially across restart boundaries? If not, what periodic
  snapshots or final recovery structure is reliable enough?
- Which event fields can Voice bind to the active queue item without depending
  on long-context memory?
- What source extraction/retrieval path best serves the maintainer for URLs
  that have paywalls, JavaScript rendering, or weak metadata?
- What is the smallest useful corpus and evaluation method for preference and
  classifier improvement?
- What should be reviewed by a human in early wiki-maintainer PRs, and what can
  later be auto-merged safely?

## Next Session Starting Point

Start from this document and the actual result of the next 11:00 AM scheduled
Task run. The next conversation should produce a concrete revised scope and
work plan, including contract ownership and small non-conflicting tasks. It
should not start by adding more safety vocabulary or by assuming that either
ChatGPT Voice or the current handoff contract is more reliable than the
observed artifacts show.
