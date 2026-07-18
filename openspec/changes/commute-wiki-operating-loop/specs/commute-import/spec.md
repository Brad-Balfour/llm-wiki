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

### Requirement: Deterministic Integrity Validation

The importer SHALL validate bundle references against the bundle's embedded
queue snapshot rather than conversational claims.

#### Scenario: Event does not match embedded queue

- **WHEN** an item-specific event references an item not present in its embedded
  queue snapshot
- **THEN** the importer SHALL reject or isolate that event
- **AND** it SHALL not silently retarget it to a similarly named item.
