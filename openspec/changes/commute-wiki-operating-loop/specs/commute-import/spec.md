# Delta for Commute Import

## ADDED Requirements

### Requirement: Multi-Bundle Single Import

The local commute import command SHALL accept one or more session bundles in a
single run and produce one consolidated maintenance input set.

#### Scenario: Import sessions from several queues

- **WHEN** Brad supplies several valid session bundles from one commute
- **THEN** the importer SHALL validate and reconcile every bundle independently
- **AND** it SHALL produce one combined result without requiring manual merging
  of queue files, ledgers, or handoffs.

### Requirement: Preserve Partial and Unresolved Records

The importer SHALL retain valid partial information while reporting its limits.

#### Scenario: Mixed valid and unresolved session data

- **WHEN** an import contains valid events, unresolved captures, or an invalid
  bundle alongside other valid bundles
- **THEN** valid sessions SHALL remain available to maintenance
- **AND** unresolved captures SHALL be preserved for recovery
- **AND** invalid bundles SHALL be reported without corrupting other sessions.

#### Scenario: Redundant depth-promotion feedback is recoverable

- **WHEN** an otherwise valid bundle records `promote_to_in_depth` for an item
  that the embedded canonical queue already marks `in_depth`
- **THEN** the importer SHALL accept the session
- **AND** it SHALL preserve the original event and user words
- **AND** it SHALL convert the downstream interpretation into a quality
  incident with an explicit reason
- **AND** it SHALL NOT emit the contradiction as classifier-training feedback
  or abort the remaining import.

### Requirement: Deterministic Integrity Validation

The importer SHALL validate bundle references against the bundle's embedded
queue snapshot rather than conversational claims.

#### Scenario: Event does not match embedded queue

- **WHEN** an item-specific event references an item not present in its embedded
  queue snapshot
- **THEN** the importer SHALL reject or isolate that event
- **AND** it SHALL not silently retarget it to a similarly named item.

#### Scenario: Complete integrity lacks complete evidence

- **WHEN** a bundle declares `complete` without a durable contemporaneous event
  record covering every claimed session action
- **THEN** the importer SHALL reject that integrity declaration
- **AND** it SHALL not silently downgrade the bundle to a trusted complete
  session.

### Requirement: Fault-Tolerant Artifact Naming Recovery

Supplied-queue recovery SHALL treat LLM-generated bundle filename metadata as
diagnostic evidence rather than semantic session identity.

#### Scenario: Recover despite malformed or contradictory artifact naming

- **WHEN** a malformed bundle has a missing, noncanonical, contradictory, or
  differently downloaded artifact filename
- **AND** the supplied queue, exact item identity, and explicit user action are
  otherwise unambiguous
- **THEN** the importer SHALL recover the evidence-supported capture
- **AND** it SHALL retain each filename defect as a warning in the private
  normalized intake
- **AND** strict bundle validation SHALL continue to report the generator defect
- **AND** recovery SHALL hard-fail only when queue, item, action, or session
  identity is ambiguous or substantively conflicting.

### Requirement: Direct Maintenance Nomination

An exact `wiki this` capture SHALL enter the maintenance input set without a
second user approval or promotion step.

#### Scenario: Import an exact wiki capture

- **WHEN** a valid bundle contains an exact current-item `wiki this` capture
- **THEN** the importer SHALL include it in the maintainer input set
- **AND** it SHALL not require an `approved` source record, `public` field, or
  local confirmation flag.

#### Scenario: Import an unresolved or non-wiki capture

- **WHEN** a bundle contains an unresolved capture, general save, or explicit
  classifier correction
- **THEN** the importer SHALL retain it in its applicable recovery, incident,
  or feedback result
- **AND** it SHALL NOT nominate it for wiki maintenance.

#### Scenario: Import a legacy skip action

- **WHEN** a bundle created before skip normalization contains an `item_action`
  with action `skip`
- **THEN** the importer SHALL retain the exact event in its navigation result
- **AND** it SHALL preserve the item binding, user words, and evidence
- **AND** it SHALL NOT treat the action as classifier feedback or nominate it
  for wiki maintenance.

### Requirement: Durable Maintenance Results

The importer SHALL retain no-change, inaccessible-source, and unresolved
maintenance outcomes in its private normalized record.

#### Scenario: Maintenance cannot produce a PR

- **WHEN** retrieval is insufficient or the maintainer finds no useful wiki
  change
- **THEN** the result SHALL be keyed by bundle, capture event, and source URL
- **AND** that compound identity SHALL use an injective canonical encoding or
  hash rather than ambiguous delimiter concatenation
- **AND** the private import record SHALL append an immutable attempt containing
  the result status, detail, source boundary, and timestamp
- **AND** it SHALL derive the candidate's latest status and attempt count from
  the append-only attempts rather than overwrite prior outcomes
- **AND** it SHALL remain available for a later retry without appearing as an
  unrelated new candidate.

#### Scenario: Retry a prior maintenance candidate

- **WHEN** a later maintenance pass supplies the prior private import record
  with the same bundle session, capture event, source URL, and maintenance key
- **THEN** local intake SHALL carry the earlier attempts into the new private
  record
- **AND** it SHALL append the retry result under that existing candidate
- **AND** it SHALL retry only candidates with no prior result or a derived
  retryable latest result
- **AND** it SHALL not retrieve or maintain a candidate whose latest result is
  a completed PR
- **AND** it SHALL reject prior history whose candidate set or exact identity
  differs from the newly reconciled bundle input.

#### Scenario: Maintainer pass fails after producing partial result data

- **WHEN** the overall maintainer pass reports or throws a failure
- **THEN** every candidate attempted by that pass SHALL receive a failed latest
  attempt
- **AND** a partial per-candidate no-change or unresolved value SHALL NOT hide
  the overall failure.

#### Scenario: A PR exists but its structured candidate result is invalid

- **WHEN** the maintainer reports a branch-matching PR URL but its per-candidate
  result is missing, duplicated, or uses an unsupported status
- **THEN** local intake SHALL retain a non-retryable `review_required` attempt
  for every candidate in that maintainer pass
- **AND** the attempt detail and top-level outcome SHALL retain the reported PR
  URL and the validation failure
- **AND** the candidate SHALL require manual reconciliation rather than
  automatically creating a duplicate maintenance PR.
