# Delta for Voice Session

## ADDED Requirements

### Requirement: One Active Queue Per Voice Session

A Voice session SHALL consume only the queue selected by an exact filename or
unambiguous date/newsletter request from the live `LLM-Wiki-Car` Project
Library.

#### Scenario: Begin a Voice session

- **WHEN** Brad names one exact queue filename or an unambiguous
  date/newsletter request in Voice and its canonical filename validates from the
  live Project Library
- **THEN** it SHALL begin from that queue's first item
- **AND** it SHALL NOT insert items from another queue
- **AND** the resulting canonical-filename lookup SHALL occur only for session
  start, not as a fallback after another queue has become active.

#### Scenario: Finish the selected queue

- **WHEN** Voice completes item `M of M` in the selected queue
- **THEN** it SHALL announce that canonical filename as finished and ask which
  queue Brad would like next
- **AND** it SHALL pause rather than automatically select another queue
- **AND** when Brad names a next queue, it SHALL create the completed queue's
  downloadable session bundle before selecting that next queue as a new session
- **AND** if bundle creation fails, it SHALL report that failure and SHALL NOT
  begin the next queue.

#### Scenario: Verify before speaking

- **WHEN** Voice is about to announce an item
- **THEN** it SHALL silently verify the selected filename, literal `N of M`
  phrase, source ID, title, URL, and reading mode against the selected queue
- **AND** the current item SHALL be exactly `items[position - 1]`, with an
  automatic advance moving only to the immediately next position
- **AND** if the selected queue is lost, a new/restarted chat lacks a fresh
  date/newsletter or exact-filename selection, or an identified item conflicts
  with it, it SHALL say `Queue context lost. End this Voice session and start
  a new selection.` and stop playback
- **AND** after session-start selection it SHALL NOT search Library, switch
  queues, or repair the cursor from conversational recollection.

### Requirement: Automatic, Terse Playback Is the Default

Voice SHALL automatically continue through the one selected queue unless Brad
interrupts, says pause, or ends the session.

#### Scenario: Normal playback

- **WHEN** Brad has not interrupted or requested a pause
- **THEN** Voice SHALL announce the item's literal `N of M` phrase and headline
- **AND** it SHALL use `consumption_depth` to choose the requested concise or
  in-depth reading style
- **AND** it SHALL make only a brief interruption-friendly gap before continuing
  to the next item
- **AND** it SHALL NOT ask whether Brad wants to continue or narrate a routine
  transition.

The brief gap is a prompt-level target, not a claim that Standard Voice can
provide a measured timer or capture every overlapping interruption.

#### Scenario: Brad gives feedback during playback

- **WHEN** Brad gives feedback, reports a defect, or corrects an interpretation
- **THEN** Voice SHALL retain the appropriate event or incident and acknowledge
  it in two or three words
- **AND** it SHALL bind item-specific feedback only to a verified current item;
  otherwise it SHALL retain an unresolved capture or a general quality incident
- **AND** it SHALL NOT repeat, summarize, diagnose, apologize at length, or ask
  a follow-up about that feedback
- **AND** it SHALL continue playback unless Brad says pause.

#### Scenario: Switch newsletters

- **WHEN** Brad wants to hear a different queue
- **THEN** the current Voice session SHALL either export successfully or be
  intentionally abandoned
- **AND** the next queue SHALL be selected by an exact filename or unambiguous
  date/newsletter request in a new session before Voice playback begins.

#### Scenario: Voice freezes, restarts, or opens a new chat

- **WHEN** the platform loses the current chat or the selected queue cannot be
  verified
- **THEN** the previous session SHALL be terminal
- **AND** the next session SHALL start from a fresh filename or date/newsletter
  selection
- **AND** it SHALL NOT claim a remembered resume position or persistent pause.

### Requirement: Prefetch Does Not Change Playback State

Any article retrieval or prefetch SHALL not advance, complete, skip, or replace
the active queue item.

#### Scenario: Retrieve next article while current item plays

- **WHEN** the Project retrieves content for a future queue item
- **THEN** the current item and recorded resume position SHALL remain unchanged
- **AND** the future item SHALL not be announced until it becomes current.
