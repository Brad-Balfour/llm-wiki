## Planning Gate

- [ ] 0.1 Review and accept the six-row journey contract in `design.md` before
      changing prompts, schemas, or runtime behavior.
- [ ] 0.2 Resolve the open questions that affect the first session-bundle
      schema version.
- [ ] 0.3 Record the current manual Task success as J1 baseline evidence and
      preserve the no-Drive task prompt as the working operator configuration.

## 1. Session Contract And Fixtures

- [ ] 1.1 Define a versioned `commute-session-bundle` schema that embeds the
      selected queue snapshot, session metadata, state, captures, feedback,
      incidents, and integrity/recovery declaration.
- [ ] 1.2 Specify the exact distinction between item-specific events and
      `unresolved_capture` records.
- [ ] 1.3 Add fixtures for a valid single-queue bundle, a partial-evidence
      recovery bundle, an unresolved capture, and multiple independent bundles.
- [ ] 1.4 Add regression fixtures for lost queue after restart, invented item,
      partial ledger falsely represented as complete, and feedback bound to the
      wrong item.

## 2. Project Instructions And Real-Car Tests

- [ ] 2.1 Revise queue-selection instructions so one text chat explicitly
      selects one named queue before Voice begins.
- [ ] 2.2 Revise Voice/session instructions to preserve exact identity or emit
      unresolved captures; remove any instruction that requires a claimed live
      mutable ledger.
- [ ] 2.3 Revise end-of-session instructions to create one self-contained
      session bundle with plain failure/recovery behavior.
- [ ] 2.4 Run controlled real-car smoke tests for J2-J4 and record results
      without treating a chat's self-report as evidence.

## 3. Deterministic Local Reconciliation

- [ ] 3.1 Implement bundle validation and compatibility import for existing
      commute handoffs where practical.
- [ ] 3.2 Implement one-command import of multiple selected bundles with
      independent per-session results.
- [ ] 3.3 Persist valid feedback and quality incidents privately, preserving
      unresolved records for recovery rather than dropping them.
- [ ] 3.4 Add focused importer tests for every session-contract fixture.

## 4. Source Retrieval And Wiki Maintenance

- [ ] 4.1 Define the maintainer input set and deterministic URL/source retrieval
      boundary.
- [ ] 4.2 Implement a maintainer workflow that reads relevant existing wiki
      pages and produces one branch/PR with created, updated, and interlinked
      Markdown as appropriate.
- [ ] 4.3 Add fixtures and review guidance for inaccessible URLs, duplicate
      source concepts, updates to existing concepts, and link-only changes.
- [ ] 4.4 Review early maintainer PRs manually before defining any auto-merge
      subset.

## 5. Learning Loops

- [ ] 5.1 Define private quality-incident storage and a triage rule for prompt,
      reference-material, deterministic-tool, and platform-limit remedies.
- [ ] 5.2 Define feedback-label storage that requires exact item identity for
      item-specific corrections.
- [ ] 5.3 Add a measured review/report that identifies repeated classifier
      misses and high-harm false skips before changing the profile or classifier
      instructions.
- [ ] 5.4 Update the project handoff/runbook with the accepted user journey and
      real-car operating procedure.
