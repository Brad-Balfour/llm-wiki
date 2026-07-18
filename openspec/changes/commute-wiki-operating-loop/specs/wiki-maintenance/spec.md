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
