# Delta for Wiki Maintenance

## ADDED Requirements

### Requirement: Existing-Wiki-Aware Maintenance

The maintenance workflow SHALL consider both retrieved source material and
relevant existing wiki pages before deciding a change.

#### Scenario: Saved source adds to an existing concept

- **WHEN** a retrieved saved source materially improves an existing wiki concept
- **THEN** the maintainer SHALL update or link the existing page when that is
  more useful than creating a duplicate page
- **AND** it SHALL include the source relationship in the resulting PR.

### Requirement: Source Retrieval Before Synthesis

The maintainer SHALL retrieve a saved HTTP(S) URL when feasible before relying
on a queue summary for wiki synthesis.

#### Scenario: Source is retrievable

- **WHEN** a saved URL can be retrieved
- **THEN** the maintainer SHALL use the retrieved source content together with
  the capture context and existing wiki
- **AND** it SHALL not treat the queue headline/summary as the complete source.

#### Scenario: Source is inaccessible

- **WHEN** a saved URL cannot be retrieved sufficiently
- **THEN** the maintainer SHALL report that limitation in the maintenance result
- **AND** it SHALL not invent a detailed source summary.

### Requirement: Direct PR Maintenance

The maintainer SHALL write its proposed wiki changes to a branch and PR without
an additional pre-write confirmation step.

#### Scenario: Maintenance produces useful changes

- **WHEN** the maintainer identifies page, link, or organization changes
- **THEN** it SHALL create one inspectable PR containing those changes
- **AND** the PR diff SHALL be the normal review point before merge.
