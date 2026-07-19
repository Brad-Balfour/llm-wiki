# Delta for Queue Selection

## ADDED Requirements

### Requirement: Explicit Single-Queue Selection

Before Voice begins, the Project SHALL bind the next session to one explicitly
named queue file.

#### Scenario: Select a named queue in text chat

- **WHEN** Brad selects or attaches one queue file in the text chat
- **THEN** the current text chat SHALL visibly contain that exact attachment
- **AND** the selection smoke test SHALL match the filename, the first item's
  literal `1 of M` playback phrase, stable source ID, and title from the file
- **AND** the eventual bundle SHALL embed a literal queue snapshot
- **AND** the local importer SHALL calculate its own SHA-256 fingerprint from
  the embedded snapshot's canonical JSON representation, rather than trust a
  model-generated hash
- **AND** the Project SHALL use that file as the sole active queue for the
  subsequent Voice session.

This smoke test is evidence of current selection, not a claim that a later
Voice turn will retain the attachment.

### Requirement: One Explicit Playback Cursor

The selected queue SHALL have exactly one canonical playback cursor. Voice
must use the literal `N of M` phrase carried by each item; it SHALL NOT derive
position from a source-item suffix, newsletter order, separate sections, or
conversational recollection.

#### Scenario: Queue has changed reading mode

- **WHEN** the next item has a different `consumption_depth` from the previous
  item
- **THEN** Voice SHALL change only its reading style
- **AND** it SHALL continue the same canonical `N of M` playback order.

#### Scenario: Ambiguous available queues

- **WHEN** more than one candidate queue is available and none is explicitly
  selected
- **THEN** Voice SHALL NOT begin item playback
- **AND** the Project SHALL present the available filenames for selection.

### Requirement: Queue Selection Is Not Conversational Memory

The Project SHALL rely on the selected file available to the current chat, not
on a remembered filename or queue state from an earlier chat.

#### Scenario: Voice restart or new chat

- **WHEN** a restart creates a new chat or the selected queue is not available
- **THEN** the Project SHALL treat the queue as unselected
- **AND** it SHALL require a new explicit text-chat selection before playback.
