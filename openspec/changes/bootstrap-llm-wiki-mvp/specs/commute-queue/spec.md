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

### Requirement: Structured Post-Commute Handoff

The manual Voice workflow SHALL support a versioned, structured handoff that can
be reviewed locally without ingesting the full conversation transcript.

#### Scenario: Generate the handoff in ChatGPT

- **WHEN** Brad ends a commute Voice session and requests a handoff
- **THEN** the same chat SHALL compile a `commute-handoff.v2` JSON object from
  reloaded authoritative queue files and an append-only structured session
  ledger in a
  `.txt` Library file
- **AND** the handoff SHALL contain one structured completion or exact resume
  state for every loaded queue
- **AND** the chat SHALL load the v2 schema and execute validation during the
  current generation pass before claiming that the handoff is ready
- **AND** corrected attempts SHALL create a new revisioned file rather than
  replacing an earlier artifact
- **AND** every item-specific record SHALL identify its exact source queue file
  in addition to session and queue identity, explicit item feedback,
  explicit saved review notes, and material recognition or interruption issues
- **AND** it SHALL NOT contain a full transcript or private detail that Brad did
  not explicitly ask to save.

#### Scenario: Record durable session actions

- **WHEN** Brad issues an item command or a material queue-state change occurs
- **THEN** the chat SHALL immediately append a structured event to its internal
  session ledger
- **AND** item-specific event identity SHALL be copied from the active queue
  object rather than reconstructed from conversational memory
- **AND** article preloading SHALL NOT advance the queue cursor, change the
  resume position, mark an item complete, or cause duplicate playback.

#### Scenario: Save an article for wiki review

- **WHEN** Brad asks to add the current queue article to the wiki
- **THEN** the saved review note SHALL copy the current queue filename, source
  item id, title, and URL exactly
- **AND** the adapter SHALL NOT invent, renumber, normalize, or guess a source
  item id or URL
- **AND** a general topic or tool preference without a matching current queue
  item SHALL be saved as general review context rather than an article-specific
  wiki review note.

#### Scenario: Import the handoff at home

- **WHEN** Brad downloads the handoff `.txt` file and runs the local importer
- **THEN** the importer SHALL validate the structured object and fail closed on
  malformed or unsupported fields
- **AND** the importer SHALL remain backward compatible with v1 handoffs
- **AND** it SHALL write a normalized create-only record to a gitignored private
  inbox
- **AND** no note SHALL be promoted into feedback labels, sources, public wiki
  output, reminders, or external messages without review.
