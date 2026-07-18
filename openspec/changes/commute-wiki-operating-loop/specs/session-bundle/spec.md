# Delta for Session Bundle

## ADDED Requirements

### Requirement: Self-Contained Session Bundle

Each completed or interrupted Voice session SHALL produce one versioned bundle
that contains enough queue context to validate its own item-specific events.

#### Scenario: Bundle a normal session

- **WHEN** a Voice session ends with available queue and event evidence
- **THEN** its bundle SHALL include session metadata, selected queue snapshot,
  playback state, explicit captures, exact feedback, quality incidents, and an
  integrity declaration
- **AND** item-specific records SHALL copy identity from the embedded selected
  queue snapshot.

### Requirement: Exact Item Binding

Item-specific feedback or wiki captures SHALL refer to an exact active queue
item at the time of the user action.

#### Scenario: User corrects the current item

- **WHEN** Brad marks the current item uninterested, asks for more depth, skips
  it, or saves it for the wiki
- **THEN** the resulting event SHALL contain the current queue filename, stable
  item identifier, title, and URL copied from the queue snapshot
- **AND** it SHALL NOT be stored as a general ChatGPT Memory.

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
