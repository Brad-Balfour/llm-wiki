# Delta for Wiki Compilation

## ADDED Requirements

### Requirement: Approved Sources Compile To OKF Markdown

The system SHALL compile approved source records into OKF-style markdown wiki
entries.

#### Scenario: Compile approved TLDR source

- **WHEN** wiki compilation runs on an approved TLDR source record routed as a
  full source/write candidate
- **THEN** the system SHALL create or update markdown under `wiki/`
- **AND** the entry SHALL preserve source provenance back to the TLDR source
  record.

### Requirement: Required Wiki Frontmatter

Compiled wiki entries SHALL include frontmatter needed for browsing, review, and
future updates.

#### Scenario: Write entry metadata

- **WHEN** the compiler writes a created or updated markdown file
- **THEN** frontmatter SHALL include `type`, `title`, `created`, `updated`,
  `confidence`, and `provenance`
- **AND** frontmatter SHALL include aliases or tags when applicable.

### Requirement: Preserve Existing Provenance

Updating an existing wiki entry SHALL preserve previous source provenance.

#### Scenario: Update existing entry

- **WHEN** a new approved source updates an existing wiki entry
- **THEN** the compiler SHALL preserve existing provenance
- **AND** the compiler SHALL add the new source provenance
- **AND** the compiler SHALL NOT silently remove prior sources.

### Requirement: Compile-State Manifest

The compiler SHALL track processed inputs and output state in a compile-state
manifest.

#### Scenario: Skip unchanged processed source

- **WHEN** a source record hash is already present in
  `schema/compile-state.json` with matching output metadata
- **THEN** the compiler SHALL skip duplicate processing or perform an idempotent
  no-op
- **AND** the compiler SHALL NOT create duplicate provenance entries.

### Requirement: Review Before Public Promotion

The compiler SHALL publish only material approved for public or repo-local wiki
output.

#### Scenario: Sensitive or ambiguous source

- **WHEN** compilation encounters private Range.com context, sensitive personal
  content, raw Gmail body text, credentials, dual-use operational detail, or
  unclear publication status
- **THEN** the item SHALL remain in review
- **AND** the item SHALL NOT be written to public wiki output automatically.

### Requirement: GitHub Pages Read Path

The MVP SHALL use GitHub Pages as the first read path for approved wiki output.

#### Scenario: Publish readable wiki

- **WHEN** approved wiki markdown exists and the MVP read path is configured
- **THEN** the wiki SHALL be readable from GitHub Pages or an equivalent
  repository-backed Pages setup
- **AND** Cloudflare Pages or Workers SHALL remain deferred unless a later
  OpenSpec change promotes them.

### Requirement: Review-Safe Initial Wiki Scaffold

The repository SHALL establish the wiki taxonomy and readable index before the
first source is compiled, without using placeholder content as evidence that
compilation is complete.

#### Scenario: Initialize the OKF wiki

- **WHEN** the initial wiki scaffold is created
- **THEN** `wiki/index.md` SHALL describe the reviewed public read path
- **AND** the taxonomy SHALL include `concept`, `tool`, `person`, and `event`
  entry locations
- **AND** an entry template SHALL demonstrate the required frontmatter and
  provenance shape
- **AND** tasks 7.1-7.5 SHALL remain incomplete until an approved source can be
  created or updated idempotently through the compiler with fixture coverage.
