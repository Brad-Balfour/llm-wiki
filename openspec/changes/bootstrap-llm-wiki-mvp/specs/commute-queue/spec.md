# Delta for Commute Queue

## ADDED Requirements

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
