# Delta for Queue Selection

## ADDED Requirements

### Requirement: Exact Project-Library Queue Startup

Before playback begins, the Project SHALL bind the session to one
unambiguously named `tldr-commute-queue.v2` file in the live Project Library.

#### Scenario: Start a named queue

- **WHEN** Brad names either one exact queue filename or an unambiguous date
  plus newsletter name in the live `LLM-Wiki-Car` Project
- **THEN** the Project SHALL normalize bare TLDR/General, Dev, AI, and Fintech
  to one dated canonical filename and MAY look up only that filename in its
  Project Library
- **AND** it SHALL validate that file as a v2 queue before playback
- **AND** the `Reading: <M> items from <filename>.` envelope SHALL match that
  file's total item count and filename
- **AND** the eventual bundle SHALL embed a literal queue snapshot
- **AND** the local importer SHALL calculate its own SHA-256 fingerprint from
  the embedded snapshot's canonical JSON representation, rather than trust a
  model-generated hash
- **AND** the Project SHALL use that file as the sole active queue for the
  session.

The `Reading:` envelope is evidence of the current active queue, not a claim
that a later Voice restart will retain it. A direct start by filename or
date/newsletter request is the normal path; a prior attachment is optional
support, not the required handoff.

### Requirement: One Explicit Playback Cursor

The active queue SHALL have exactly one canonical playback cursor. Voice
must use the literal `N of M` phrase carried by each item; it SHALL NOT derive
position from a source-item suffix, newsletter order, separate sections, or
conversational recollection.

#### Scenario: Queue has changed reading mode

- **WHEN** the next item has a different `consumption_depth` from the previous
  item
- **THEN** Voice SHALL change only its reading style
- **AND** it SHALL continue the same canonical `N of M` playback order.

#### Scenario: Ambiguous available queues

- **WHEN** Brad's request does not normalize to one canonical filename
- **THEN** Voice SHALL NOT begin item playback
- **AND** the Project SHALL ask Brad for a date and newsletter name or an exact
  filename.

### Requirement: Queue Startup Is Not Conversational Memory

The Project SHALL rely on the canonical file derived from Brad's current
unambiguous request and available in its live Project Library, not on a
remembered filename or queue state from an earlier chat.

#### Scenario: Voice restart or new chat

- **WHEN** a restart creates a new chat or the active queue is not available
- **THEN** the Project SHALL treat the queue as inactive
- **AND** it SHALL require Brad to name a date/newsletter pair or one exact
  filename again before playback.
