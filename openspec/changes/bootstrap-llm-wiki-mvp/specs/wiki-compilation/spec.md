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

#### Scenario: Reuse a source item id with conflicting provenance

- **WHEN** a proposed immutable source reuses an existing source item id with a
  different source path or URL
- **THEN** the compiler SHALL reject the provenance collision
- **AND** it SHALL NOT mark the conflicting record processed or silently treat
  it as an idempotent rerun.

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

#### Scenario: Confirm public compilation locally

- **WHEN** an otherwise approved source is submitted to the local compiler
- **THEN** its approval record SHALL show cleared privacy,
  publication-rights, and dual-use review
- **AND** the operator SHALL provide an explicit local public-confirmation flag
- **AND** a model-authored `public: true` value alone SHALL NOT authorize a
  public write.

### Requirement: Batch Handoff Ingestion

The handoff ingestion command SHALL evaluate every wiki-marked candidate in one
run unless the operator explicitly selects one source item.

#### Scenario: Process a mixed handoff batch

- **WHEN** a validated commute handoff contains multiple wiki-marked candidates
- **THEN** the command SHALL evaluate every candidate independently
- **AND** it SHALL publish eligible reviewed candidates without preventing the
  remaining candidates from being evaluated
- **AND** it SHALL report each candidate as published, already published,
  needing source details, needing a reviewed summary, or failed
- **AND** operator-facing output SHALL describe missing information in ordinary
  language rather than internal data-model terminology.

### Requirement: Safe Public Rendering

The compiler SHALL validate and safely render public source fields before
writing a Pages-visible Markdown file.

#### Scenario: Unsafe public field

- **WHEN** a proposed source contains a non-HTTP(S) or credential-bearing URL,
  raw HTML, an embedded Markdown link, control characters, credential-like
  content, or private Range.com context
- **THEN** compilation SHALL fail closed before changing wiki output or compile
  state
- **AND** approved plain text SHALL be Markdown-escaped when rendered.

### Requirement: GitHub Pages Read Path

The MVP SHALL use GitHub Pages as the first read path for approved wiki output.

#### Scenario: Publish readable wiki

- **WHEN** approved wiki markdown exists and the MVP read path is configured
- **THEN** the wiki SHALL be readable from GitHub Pages or an equivalent
  repository-backed Pages setup
- **AND** Cloudflare Pages or Workers SHALL remain deferred unless a later
  OpenSpec change promotes them.

### Requirement: Deterministic Site-Source Validation

The project checks SHALL validate Pages source files before the remote Jekyll
build runs.

#### Scenario: Validate Jekyll inputs locally and in CI

- **WHEN** the project check command runs
- **THEN** repository YAML files and all Pages-visible Markdown frontmatter
  SHALL parse as YAML
- **AND** the entry template provenance SHALL use the compiler-compatible
  single-line JSON shape
- **AND** the Pages workflow SHALL still perform a real Jekyll build before
  deployment.

### Requirement: Review-Safe Initial Wiki Scaffold

The repository SHALL establish the wiki taxonomy and readable index before the
first source is compiled, without using placeholder content as evidence that
compilation is complete.

#### Scenario: Initialize the OKF wiki

- **WHEN** the initial wiki scaffold is created
- **THEN** `wiki/index.md` SHALL describe the reviewed public read path
- **AND** the taxonomy SHALL include `concept`, `tool`, `person`, and `event`
  entry locations
- **AND** the wiki and taxonomy indexes SHALL have Jekyll frontmatter and stable
  directory permalinks so their Pages URLs render
- **AND** an entry template SHALL demonstrate the required frontmatter and
  provenance shape
- **AND** tasks 7.1-7.5 SHALL remain incomplete until an approved source can be
  created or updated idempotently through the compiler with fixture coverage.
