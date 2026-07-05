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

The MVP SHALL use manual ChatGPT or Claude voice review before custom realtime
voice infrastructure.

#### Scenario: Use queue in manual voice session

- **WHEN** Brad uses ChatGPT, Claude, or an equivalent manual voice workflow with
  a prepared commute queue
- **THEN** the queue SHALL provide the input for quick reads and discussion
- **AND** the MVP SHALL NOT require a custom Realtime API agent for completion.

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
  corrections or notes produced by the session
- **AND** those corrections SHALL be stored as feedback labels or review notes.
