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

### Requirement: Direct Maintenance Nomination

An exact `wiki this` capture SHALL enter the maintenance input set without a
second user approval or promotion step.

#### Scenario: Import an exact wiki capture

- **WHEN** a valid bundle contains an exact current-item `wiki this` capture
- **THEN** the importer SHALL include it in the maintainer input set
- **AND** it SHALL not require an `approved` source record, `public` field, or
  local confirmation flag.

#### Scenario: Import an unresolved or non-wiki capture

- **WHEN** a bundle contains an unresolved capture, general save, skip, or
  classifier correction
- **THEN** the importer SHALL retain it in its applicable recovery, incident,
  or feedback result
- **AND** it SHALL NOT nominate it for wiki maintenance.

### Requirement: Durable Maintenance Results

The importer SHALL retain no-change, inaccessible-source, and unresolved
maintenance outcomes in its private normalized record.

#### Scenario: Maintenance cannot produce a PR

- **WHEN** retrieval is insufficient or the maintainer finds no useful wiki
  change
- **THEN** the result SHALL be keyed by bundle, capture event, and source URL
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
- **AND** it SHALL reject prior history whose candidate set or exact identity
  differs from the newly reconciled bundle input.
