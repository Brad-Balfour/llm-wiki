# Delta for Session Bundle

## ADDED Requirements

### Requirement: Self-Contained Session Bundle

A normally ended Voice session SHALL attempt to produce one versioned bundle
that contains enough queue context to validate its own item-specific events.
An abrupt platform loss may leave no bundle; it must not be represented as a
successful export.

#### Scenario: Bundle a normal session

- **WHEN** a Voice session ends with available queue and event evidence
- **THEN** its bundle SHALL include session metadata, selected queue snapshot,
  playback state, explicit captures, exact feedback, quality incidents, and an
  integrity declaration
- **AND** item-specific records SHALL copy identity from the embedded selected
  queue snapshot.

#### Scenario: Queue completion waits for an explicit end command

- **WHEN** Voice completes the active queue's final `M of M` item
- **THEN** it SHALL keep that item current, announce that the named queue is
  finished, and wait for Brad's next command
- **AND** it SHALL NOT auto-advance, auto-export, discard the active queue, or
  start another queue.

### Requirement: Observable Bundle Delivery

A successful session export SHALL be an identifiable downloadable artifact, not
a statement that an artifact or ledger exists.

#### Scenario: Bundle delivery succeeds

- **WHEN** the Project creates a session bundle
- **THEN** it SHALL provide a visible downloadable artifact in the current chat
  or Project Library
- **AND** later local validation SHALL parse the artifact and verify its queue
  snapshot fingerprint.

### Requirement: Unique, Readable Bundle Filename

Every bundle artifact SHALL have a session-end-local-time filename of the form
`YYYYMMDDHHmm-morning-commute-session-bundle.txt` or
`YYYYMMDDHHmm-evening-commute-session-bundle.txt`, using America/New_York
export time rather than UTC. The label is determined by that time: before 12:00
is `morning`; 12:00 or later is `evening`.

#### Scenario: Two sessions export on the same day

- **WHEN** two Voice sessions export bundles on the same day
- **THEN** each artifact SHALL have its own timestamped filename
- **AND** the Project SHALL NOT reuse bare `commute-session-bundle.txt`
- **AND** a numeric suffix such as `(1)` added by Library after creation SHALL
  be accepted as the same exported artifact rather than treated as an export
  failure. The bundle records the canonical requested filename because it may
  not be able to observe a suffix assigned after its JSON is written.

#### Scenario: New York time differs from UTC

- **WHEN** export occurs at 9:46 PM EDT on July 19
- **THEN** the canonical artifact filename SHALL start with `202607192146` and
  use the `evening` label
- **AND** it SHALL NOT use the UTC value `202607200146` or a July 20 `morning`
  label.

#### Scenario: Bundle delivery fails

- **WHEN** the Project cannot create a downloadable session-bundle artifact
- **THEN** it SHALL state that no downloadable bundle was created
- **AND** it SHALL NOT claim an existing ledger, reconstruction, or importable
  handoff
- **AND** it SHALL NOT fabricate item-specific recovery events from
  conversational memory.

#### Scenario: Active queue snapshot needs recovery at export

- **WHEN** the Project no longer has the complete active queue JSON needed for
  `queue_snapshot.queue`
- **THEN** it SHALL automatically reload only the already named canonical queue
  filename from the Project Library
- **AND** if it finds valid queue JSON, it SHALL emit the requested bundle with
  `recovered` integrity and only evidence-supported events
- **AND** it SHALL report export failure only if that exact file cannot be
  reloaded or no downloadable artifact can be created.

### Requirement: Exact Item Binding

Item-specific feedback or wiki captures SHALL refer to an exact active queue
item at the time of the user action.

#### Scenario: User corrects the current item

- **WHEN** Brad marks the current item uninterested, asks for more depth, skips
  it, or saves it for the wiki
- **THEN** the resulting event SHALL contain the current queue filename, stable
  item identifier, title, and URL copied from the queue snapshot
- **AND** it SHALL NOT be stored as a general ChatGPT Memory.

#### Scenario: Natural-language wiki capture

- **WHEN** the Project records an item action as `wiki_this` with direct user
  evidence and an exact verified current item
- **THEN** the local validator SHALL accept the natural-language wording rather
  than require one memorized phrase.

#### Scenario: User saves the current item

- **WHEN** Brad asks to save the verified current item for the wiki
- **THEN** the bundle SHALL record an exact maintenance capture for that item
- **AND** that capture SHALL be sufficient input for later source retrieval and
  maintainer PR work
- **AND** it SHALL NOT require a second spoken approval or an intermediate
  approval record.

#### Scenario: Recovered transition omits an announcement

- **WHEN** a `partial` or `recovered` bundle has an exact `next` transition for
  the expected queue item but lacks the preceding announcement event
- **THEN** the local validator MAY reconstruct only the cursor state needed to
  continue validating later events
- **AND** it SHALL NOT use that recovery to bind an otherwise unresolved wiki
  capture to the item.

#### Scenario: Active item cannot be verified

- **WHEN** the Project cannot verify the active queue item
- **THEN** it SHALL create an `unresolved_capture` with Brad's explicit words
  and available recovery clues
- **AND** it SHALL NOT invent an item identifier, title, URL, or feedback
  target.

### Requirement: Honest Recovery State

The bundle SHALL state whether its event information is complete, partial, or
recovered from incomplete evidence.

#### Scenario: Live ledger is absent or incomplete

- **WHEN** a ledger or equivalent event record cannot substantiate all claimed
  session events
- **THEN** the bundle SHALL mark its integrity as partial or recovered
- **AND** it SHALL identify the affected events or unresolved captures
- **AND** it SHALL NOT claim that every action was recorded live.

#### Scenario: End command has only visible session evidence

- **WHEN** Brad ends an active session but no durable contemporaneous event
  record exists
- **THEN** the Project SHALL still attempt a downloadable partial bundle using
  the complete active queue snapshot and visible session evidence
- **AND** it SHALL retain only exact item actions that can be supported by that
  evidence, using unresolved captures for anything else
- **AND** it SHALL NOT refuse export solely because the event record is not
  durable or complete.

### Requirement: Integrity Evidence Coverage

The bundle SHALL declare event-level evidence sources and an integrity state of
`complete`, `partial`, or `recovered`.

#### Scenario: No durable contemporaneous event record

- **WHEN** a bundle lacks a durable record that covers every claimed action from
  session start through end
- **THEN** its integrity SHALL be `partial` or `recovered`
- **AND** it SHALL NOT declare itself `complete`.

### Requirement: Ordered Current-Item Lifecycle

The bundle SHALL record monotonic queue-state and action transitions so that an
item-specific action can be validated against the announced current item.

#### Scenario: Feedback follows an announced item

- **WHEN** an item-specific action is recorded
- **THEN** the bundle SHALL show that the same item was current and announced
  before the action
- **AND** no later `next`, skip, repeat, interruption, or replacement transition
  may already have changed the current item
- **AND** an ambiguous or duplicate recognition SHALL become an unresolved
  capture rather than a valid-looking action on another item.

#### Scenario: Advance to the next item

- **WHEN** playback advances from one announced item to its immediate successor
- **THEN** the `playback_transition` record SHALL identify the current,
  departing item
- **AND** the following `item_announced` record SHALL identify the successor
- **AND** the transition SHALL NOT duplicate the successor or add a separate
  destination-item field.

### Requirement: Quality Incidents Do Not Require Model Diagnosis

A session bundle SHALL retain user-observed or structurally detected product
problems without requiring the model to explain their cause.

#### Scenario: Brad reports a system problem

- **WHEN** Brad reports a missing queue, invented item, audio failure, or
  incorrect interpretation
- **THEN** the bundle SHALL record an unclassified quality incident with the
  observed behavior, boundary, and available evidence pointer
- **AND** it SHALL NOT present a model diagnosis as established fact.
