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

### Requirement: Observable Bundle Delivery

A successful session export SHALL be an identifiable downloadable artifact, not
a statement that an artifact or ledger exists.

#### Scenario: Bundle delivery succeeds

- **WHEN** the Project creates a session bundle
- **THEN** it SHALL provide a visible downloadable artifact in the current chat
  or Project Library
- **AND** later local validation SHALL parse the artifact and verify its queue
  snapshot fingerprint.

#### Scenario: Bundle delivery fails

- **WHEN** the Project cannot create a downloadable session-bundle artifact
- **THEN** it SHALL state that no downloadable bundle was created
- **AND** it SHALL NOT claim an existing ledger, reconstruction, or importable
  handoff
- **AND** it SHALL NOT fabricate item-specific recovery events from
  conversational memory.

### Requirement: Exact Item Binding

Item-specific feedback or wiki captures SHALL refer to an exact active queue
item at the time of the user action.

#### Scenario: User corrects the current item

- **WHEN** Brad marks the current item uninterested, asks for more depth, skips
  it, or saves it for the wiki
- **THEN** the resulting event SHALL contain the current queue filename, stable
  item identifier, title, and URL copied from the queue snapshot
- **AND** it SHALL NOT be stored as a general ChatGPT Memory.

#### Scenario: Equivalent wiki capture phrases

- **WHEN** Brad says `wiki this`, `add this to my wiki`, or `save this for the
wiki` for a verified current item
- **THEN** the Project SHALL treat the phrases as equivalent exact maintenance
  captures.

#### Scenario: User says wiki this

- **WHEN** Brad says `wiki this` for a verified current item
- **THEN** the bundle SHALL record an exact maintenance capture for that item
- **AND** that capture SHALL be sufficient input for later source retrieval and
  maintainer PR work
- **AND** it SHALL NOT require a second spoken approval or an intermediate
  approval record.

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

### Requirement: Quality Incidents Do Not Require Model Diagnosis

A session bundle SHALL retain user-observed or structurally detected product
problems without requiring the model to explain their cause.

#### Scenario: Brad reports a system problem

- **WHEN** Brad reports a missing queue, invented item, audio failure, or
  incorrect interpretation
- **THEN** the bundle SHALL record an unclassified quality incident with the
  observed behavior, boundary, and available evidence pointer
- **AND** it SHALL NOT present a model diagnosis as established fact.
