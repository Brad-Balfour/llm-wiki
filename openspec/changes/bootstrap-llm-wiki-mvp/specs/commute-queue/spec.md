# Delta for Commute Queue

## ADDED Requirements

### Requirement: Queue V4 Separates Playback From Reference Data

New Project generation SHALL create a strictly minimal playback file and a
matching complete reference file while local readers retain v2/v3 support.

#### Scenario: Generate and validate a v4 pair

- **WHEN** generation produces a queue-v4 result
- **THEN** the main file SHALL contain only `sweep_playback` and
  `items[].item_playback`
- **AND** the reference SHALL identify the main filename and its SHA-256 over
  `JSON.stringify(parsedMain)`
- **AND** reference entries SHALL match main entries by position
- **AND** a missing, stale, swapped, or reordered reference SHALL be rejected.

### Requirement: Prepared Commute Queue

The system SHALL generate a prepared commute queue from routed TLDR items before
any custom voice agent is built.

#### Scenario: Generate daily queue

- **WHEN** the commute queue is generated from validated and routed TLDR items
- **THEN** the queue SHALL include surfaced `interested` and `maybe` items
- **AND** the queue SHALL exclude `uninterested` items except for audit or review
  metadata.

### Requirement: Queue Priority Order

The commute queue SHALL order items so high-interest quick-read awareness items
are covered before open-ended discussion items.

#### Scenario: Sort queue

- **WHEN** routed commute items are sorted
- **THEN** `interested/headline_only` items SHALL appear before
  `interested/in_depth` items
- **AND** `interested/in_depth` items SHALL appear before
  `maybe/headline_only` items
- **AND** `maybe/headline_only` items SHALL appear before `maybe/in_depth` items
- **AND** `maybe` items SHALL be downgraded or deferred before `interested`
  items when available commute time is short.

#### Scenario: Session navigation does not rewrite queue order

- **WHEN** Brad begins detailed playback at an arbitrary queue item, skips
  positions, returns backward, jumps forward, or repeats an item
- **THEN** the queue's `items` array SHALL remain the canonical identity and
  relative ordering
- **AND** that order SHALL NOT require the session to visit every item or visit
  items in ascending order.

### Requirement: Quick-Read And Discuss Sections

The queue SHALL make quick-read awareness items distinct from discussion items.

#### Scenario: Render queue sections

- **WHEN** the queue file is written
- **THEN** the file SHALL separate discuss items from quick-read items
- **AND** each item SHALL include source item id, title, summary, URL,
  `interest_level`, `interest_score`, `consumption_depth`, `depth_score`,
  derived commute behavior, reason, and version metadata.

### Requirement: Manual Voice Review First

The MVP SHALL use manually initiated ChatGPT Voice, preferring GPT Live when it
is available to the current consumer account, Claude, or an equivalent voice
workflow before custom voice infrastructure. GPT Live SHALL be treated as a
ChatGPT surface enhancement, not as an available API dependency.

#### Scenario: Use queue in manual voice session

- **WHEN** Brad uses ChatGPT Voice, Claude, or an equivalent manual voice
  workflow with a prepared commute queue
- **THEN** the queue SHALL provide the input for quick reads and discussion
- **AND** the queue SHALL be loaded manually as sanitized conversation input
  before the session rather than retrieved from the repository or a connected
  application
- **AND** the MVP SHALL NOT require a custom Realtime or GPT Live API agent for
  completion.

### Requirement: Tesla-Compatible Voice Validation

The first real-car validation SHALL work with a Tesla Model 3 through the
phone-based workflow selected for the test. It SHALL NOT assume a particular
in-dash integration.

#### Scenario: Prepare a car session

- **WHEN** Brad prepares a real-car voice validation session
- **THEN** the selected phone-based workflow and queue SHALL be ready before the
  vehicle is in motion
- **AND** the test record SHALL identify the selected voice surface without
  storing raw audio or a full conversation transcript in the repository.

### Requirement: Voice Notes Route To Review

Voice notes and commute corrections SHALL be reviewed before publication or
external action.

#### Scenario: Capture voice note

- **WHEN** Brad records or writes a commute note such as "add this to the wiki"
  or "this is a Range note"
- **THEN** the note SHALL be placed in review
- **AND** the note SHALL NOT be compiled into public wiki output, sent
  externally, or committed as sensitive freeform content without explicit
  review.

### Requirement: Queue Usage Evidence

The MVP SHALL record that at least one prepared queue was used.

#### Scenario: Complete first voice validation

- **WHEN** Brad completes a real car session or equivalent manual voice test
  with a prepared queue
- **THEN** the project SHALL record the queue date, source batch, and any
  corrections or notes produced by the session, plus the selected voice surface
  and any material interruption or recognition issue
- **AND** those corrections SHALL be stored as feedback labels or review notes.

### Requirement: Manual ChatGPT Project Adapter

The MVP SHALL permit a ChatGPT Project to act as a manual adapter for connector-assisted
classification, queue creation, and Voice playback before the repository's
provider-neutral classifier and deterministic queue generator are complete.

#### Scenario: Create a queue in a project chat

- **WHEN** a project chat classifies a body-confirmed TLDR newsletter through the
  Gmail connector using the versioned project source files
- **THEN** it MAY create an ordered queue as JSON content in a `.txt` file
- **AND** the queue SHALL preserve source item ids and the metadata required by
  the prepared-queue contract
- **AND** within each source-newsletter queue, duplicate candidates SHALL resolve
  to one item by highest interest score, then highest depth score, then earliest
  source occurrence
- **AND** Headline Only and In-Depth SHALL be mutually exclusive sections
- **AND** this manual output SHALL NOT be treated as satisfying the repository's
  classifier-adapter or deterministic queue-generation implementation tasks.
