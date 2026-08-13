## Planning Gate

- [ ] 0.1 Review the six-row journey contract against the observed July 20-25
      workflow and explicitly accept or revise it before replacing working
      prompts, schemas, or runtime behavior. This is a non-regression decision,
      not permission to restore an older plan.
- [x] 0.2 Resolve the questions that affected the first session-bundle schema
      version through the implemented v1 schema, importer, fail-soft behavior,
      and July 24 real-bundle evidence. New questions become scoped follow-up
      work rather than reopening the first-version gate.
- [x] 0.3 Record the successful scheduled runs as historical J1 evidence,
      preserve the no-Drive task prompt, and record the July 21-24 scheduled
      artifact-writing regression plus the successful July 24 manual control.
- [x] 0.4 Audit bootstrap commute/wiki requirements against the compatibility
      map; do not mark legacy operator instructions obsolete until their
      replacements pass real-car tests.
- [ ] 0.5 For future behavior-changing planning revisions, run separate
      OpenSpec/governance, real-commute/non-regression, and content-safeguard/
      direct-PR reviews. This is a recurring change-quality gate, not missing
      runtime functionality.

## 1. Session Contract And Fixtures

- [x] 1.1 Define a versioned `commute-session-bundle` schema that embeds the
      selected queue snapshot, session metadata, state, captures, feedback,
      incidents, integrity/recovery declaration, evidence coverage, and
      monotonic item/action transitions.
- [x] 1.2 Specify the exact distinction between item-specific events and
      `unresolved_capture` records.
- [x] 1.3 Add fixtures for a valid single-queue bundle, a partial-evidence
      recovery bundle, an unresolved capture, and multiple independent bundles.
- [x] 1.4 Add regression fixtures for lost queue after restart, invented item,
      partial ledger falsely represented as complete, and feedback bound to the
      wrong item, including a `next` transition that incorrectly names its
      destination rather than its departing item.
- [x] 1.5 Add fixtures for same filename with different queue content, terminal
      Voice restart, final-bundle creation failure, duplicate feedback utterance,
      and a ChatGPT Memory misinterpretation.
- [x] 1.6 Define and test queue-v2's single N-of-M playback order, including
      rejection/audit fixtures for wrong section/count, repeated, foreign, and
      unmatched announced items.
- [x] 1.7 Require and validate unique timestamped session-bundle filenames.
      Timestamp format, two distinct same-day exports, and Library-added numeric
      suffixes are covered, and local intake rejects distinct sessions declaring
      the same canonical artifact filename.

## 2. Live Project Instructions And Real-Car Tests

- [x] 2.1 Revise queue-selection instructions so a Voice or text session starts
      only after Brad names an exact v2 filename or unambiguous date/newsletter
      pair and the live `LLM-Wiki-Car` Project Library resolves that canonical
      file, with a filename/N-of-M/title selection-challenge smoke test. Prompt
      Revision 3.0 is semantically present in the live Project.
- [x] 2.2 Revise Voice/session instructions to preserve exact identity or emit
      unresolved captures; allow Project Library lookup at canonical filename
      session start and exact named-file recovery, and remove any instruction
      that requires a claimed live mutable ledger. July 24-25 conversations
      exercised queue recovery, direct field projection, and bundle export.
- [x] 2.3 Revise end-of-session instructions to create one self-contained
      session bundle with plain failure/recovery behavior.
- [x] 2.4 Run controlled real-car smoke tests for J2-J4 and record results
      without treating a chat's self-report as evidence.
- [x] 2.5 Deliberately cut the managed ChatGPT Task over to queue-v2 after its
      schema and prompt are uploaded in `LLM-Wiki-Car`. The live managed prompt
      exactly matches the committed v2 body and the expected six Project
      sources are present. Scheduled artifact reliability remains a J1/platform
      issue; cutover completion does not claim that July 21-24 runs succeeded.

## 3. Home-Side Bundle Intake And Reconciliation

**Meaning:** after a commute, Brad supplies the downloaded original queue(s)
and session bundle(s) to a maintenance/debug chat. The agent invokes the
repository package scripts to validate each bundle, reconcile its events
against its embedded or supplied queue, retain private incidents/feedback, and
prepare wiki-maintenance input. This is not Voice playback and it does not
combine unrelated conversations or queues into one queue.

- [x] 3.1 Implement bundle validation and compatibility import for existing
      commute handoffs where practical.
- [x] 3.2 Implement one-command import of multiple selected bundles with
      independent per-session results.
- [x] 3.3 Persist valid feedback and quality incidents privately, preserving
      unresolved records for recovery rather than dropping them.
- [x] 3.4 Store each no-change, inaccessible-source, and unresolved maintenance
      result in the private import record keyed by bundle, event, and source URL
      so that it can be retried without becoming a new untracked candidate.
      Attempts are append-only, latest status is derived, and a retry may carry
      forward only an exactly matching prior intake record.
- [x] 3.5 Add focused importer tests for every session-contract fixture.

## 4. Source Retrieval And Wiki Maintenance

- [x] 4.1 Define the maintainer input set and deterministic URL/source retrieval
      boundary, including content safeguards that omit private or unsafe details
      without creating a user-facing approval step, and a public-source rights
      policy for link-plus-original-synthesis versus no-change outcomes.
- [x] 4.2 Implement a maintainer workflow that reads relevant existing wiki
      pages and produces one branch/PR with created, updated, and interlinked
      Markdown as appropriate, or an observable no-change/insufficient-source
      result when no PR is useful. Compose it with private bundle intake as one
      top-level user-facing command, with no intermediate intake review gate.
- [x] 4.3 Add fixtures and review guidance for inaccessible URLs, duplicate
      source concepts, updates to existing concepts, and link-only changes.
- [x] 4.4 Review early maintainer PRs manually before defining any auto-merge
      subset.
- [x] 4.5 Document the supported user workflow as chat-mediated maintenance:
      upload or otherwise supply the original queue(s) and session bundle(s),
      then ask the agent to debug and process them. Keep `validate:*`,
      `import:*`, `retrieve:*`, and maintainer package scripts as agent-invoked
      internals and diagnostics; do not remove or combine them merely to create
      a human-facing CLI.

## 5. Separate Learning And Reliability Loops

### 5A. Product/Platform Reliability

- [x] 5.1 Define private quality-incident storage and a triage rule for prompt,
      reference-material, deterministic-tool, and platform-limit remedies.
      This includes playback/queue-projection defects, queue discovery, bundle
      creation, scheduled artifact writes, and other car/Task failures. These
      records are not classifier training labels.

### 5B. Classifier Calibration

- [x] 5.2 Define feedback-label storage that requires exact item identity for
      item-specific interest, depth, or routing corrections. Do not include
      playback defects, presentation preferences, duplicate/prior-awareness
      observations, general car bugs, or assistant synthesis.
- [ ] 5.3 Add a measured review/report that identifies repeated classifier
      misses and high-harm false skips before changing the profile or classifier
      instructions.

### 5C. Operator Documentation And Retirement

- [x] 5.4 Update the project handoff/runbook with the accepted user journey and
      real-car operating procedure.
- [x] 5.5 Once the default-change criteria in `design.md` pass, update
      `AGENTS.md` and current operator documentation, then remove or clearly
      relocate stale historical July 12 documents after a link/reference audit.
