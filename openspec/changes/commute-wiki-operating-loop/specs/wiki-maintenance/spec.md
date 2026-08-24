# Delta for Wiki Maintenance

## ADDED Requirements

### Requirement: One-Command Commute Maintenance

The user-facing home-side workflow SHALL accept one or more downloaded session
bundles and run intake, source retrieval, existing-wiki maintenance, and PR
creation as one command. The private intake record is an internal artifact, not
an approval checkpoint.

#### Scenario: Valid wiki capture produces a PR without an intake review

- **WHEN** Brad supplies one or more downloaded session bundles to the
  top-level maintenance command
- **THEN** it SHALL independently retain invalid or unresolved sessions while
  continuing with valid exact `wiki this` captures
- **AND** it SHALL retrieve feasible sources, inspect relevant existing wiki
  pages, and create a branch/PR when useful changes result
- **AND** it SHALL NOT stop for Brad to review or promote the private intake
  record before maintenance begins.

### Requirement: Existing-Wiki-Aware Maintenance

The maintenance workflow SHALL consider both retrieved source material and
relevant existing wiki pages before deciding a change.

#### Scenario: Saved source adds to an existing concept

- **WHEN** a retrieved saved source materially improves an existing wiki concept
- **THEN** the maintainer SHALL update or link the existing page when that is
  more useful than creating a duplicate page
- **AND** it SHALL include the source relationship in the resulting PR.

#### Scenario: Saved source duplicates an existing concept

- **WHEN** a retrieved saved source names a concept the wiki already covers and
  adds no material information or useful relationship
- **THEN** the maintainer SHALL record `no_change` naming the existing page
- **AND** it SHALL NOT create a duplicate concept page.

#### Scenario: Saved source justifies a link-only change

- **WHEN** the useful maintenance effect is a meaningful relationship between
  existing wiki concepts rather than new prose
- **THEN** the maintainer MAY create a link-only PR that identifies the affected
  pages
- **AND** it SHALL NOT create cosmetic link churn, filler prose, or a duplicate
  page.

### Requirement: Source Retrieval Before Synthesis

The maintainer SHALL retrieve a saved HTTP(S) URL when feasible before relying
on a queue summary for wiki synthesis.

#### Scenario: Source is retrievable

- **WHEN** a saved URL can be retrieved
- **THEN** the maintainer SHALL use the retrieved source content together with
  the capture context and existing wiki
- **AND** it SHALL not treat the queue headline/summary as the complete source.

### Requirement: Item-Bound Discussion Context

The direct-maintainer workflow SHALL accept an optional concise,
evidence-backed discussion record on an exact `wiki_this` capture when it is
bound to that same session, event, queue item, and URL. The maintainer SHALL use
supported context when it materially improves the page and SHALL keep it
visibly distinct from retrieved-source facts. Absence or invalidity of a
discussion record SHALL NOT block bundle export, import, or maintenance.

#### Scenario: A saved item has supported discussion context

- **WHEN** a maintenance candidate carries a discussion record with direct
  evidence and exact saved-item identity
- **THEN** the maintainer SHALL receive that record with the retrieved source
- **AND** its private result SHALL state whether the discussion was incorporated,
  omitted as unsupported, or left unresolved
- **AND** it SHALL NOT attach a general capture or another item's discussion by
  proximity or inference.

#### Scenario: Source is inaccessible

- **WHEN** a saved URL cannot be retrieved sufficiently
- **THEN** the maintainer SHALL report that limitation in the maintenance result
- **AND** it SHALL not invent a detailed source summary.

#### Scenario: Retrieved source produces no useful wiki change

- **WHEN** the maintainer retrieves a nominated source but finds no useful page,
  link, or organization change
- **THEN** it SHALL record an observable no-change maintenance result
- **AND** it SHALL NOT create a filler page or misleading PR.

### Requirement: Direct PR Maintenance

The maintainer SHALL write its proposed wiki changes to a branch and PR without
an additional pre-write confirmation step.

#### Scenario: Maintenance produces useful changes

- **WHEN** the maintainer identifies page, link, or organization changes
- **THEN** it SHALL create one inspectable PR containing those changes
- **AND** the PR diff SHALL be the normal review point before merge.

#### Scenario: Early maintainer PR is reviewed

- **WHEN** an early maintainer PR creates, updates, or interlinks wiki pages
- **THEN** review guidance SHALL check source grounding, duplicate avoidance,
  provenance preservation, useful link relationships, content safeguards, and
  Jekyll validity
- **AND** fixture coverage SHALL NOT be treated as defining an auto-merge
  subset.

### Requirement: Content Safeguards Without Approval Ceremony

The maintainer SHALL protect raw email content, credentials, private work notes,
and unsafe rendered content without requiring an additional user approval step
after a `wiki this` capture.

#### Scenario: Saved source contains publishable material

- **WHEN** a saved source and its capture contain material suitable for the wiki
- **THEN** the maintainer SHALL write the proposed branch/PR directly
- **AND** it SHALL NOT require an `approved` source field, `public: true` model
  field, or local public-confirmation flag before writing the PR.

#### Scenario: Source or capture includes protected detail

- **WHEN** source material or a capture includes raw email text, credentials,
  private work context, or unsafe rendered content
- **THEN** the maintainer SHALL omit or sanitize that detail from the PR
- **AND** it SHALL report the limitation in the maintenance result
- **AND** it SHALL NOT publish the protected detail or ask Brad to navigate a
  second approval workflow for ordinary maintenance.

### Requirement: Public-Source Synthesis Respects Publication Boundaries

For a public source with uncertain reuse rights, the maintainer SHALL link to
the source and use concise original synthesis rather than copy article text.

#### Scenario: Rights do not support useful original synthesis

- **WHEN** the maintainer cannot support a concise, source-grounded synthesis
  without reproducing protected text
- **THEN** it SHALL create an insufficient-source or no-change maintenance
  result
- **AND** it SHALL NOT require a new user approval to make that decision.
