# Delta for Queue Selection

## ADDED Requirements

### Requirement: Explicit Single-Queue Selection

Before Voice begins, the Project SHALL bind the next session to one explicitly
named queue file.

#### Scenario: Select a named queue in text chat

- **WHEN** Brad selects or attaches one queue file in the text chat
- **THEN** the current text chat SHALL visibly contain that exact attachment
- **AND** the selection smoke test SHALL match the filename and a canonical
  first-item identity from the file
- **AND** the eventual bundle SHALL embed a literal queue snapshot
- **AND** the local importer SHALL calculate a SHA-256 fingerprint from the
  embedded snapshot's exact UTF-8 source bytes, rather than trust a
  model-generated hash
- **AND** the Project SHALL use that file as the sole active queue for the
  subsequent Voice session.

This smoke test is evidence of current selection, not a claim that a later
Voice turn will retain the attachment.

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
