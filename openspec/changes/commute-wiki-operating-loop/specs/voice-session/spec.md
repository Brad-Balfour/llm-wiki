# Delta for Voice Session

## ADDED Requirements

### Requirement: One Active Queue Per Voice Session

A Voice session SHALL consume only the queue selected in its originating text
chat.

#### Scenario: Begin a Voice session

- **WHEN** Voice starts from a chat with one selected queue
- **THEN** it SHALL begin from that queue's recorded first/resume item
- **AND** it SHALL NOT insert items from another queue.

#### Scenario: Verify before speaking

- **WHEN** Voice is about to announce an item
- **THEN** it SHALL silently verify the selected filename, literal `N of M`
  phrase, source ID, title, URL, and reading mode against the selected queue
- **AND** the current item SHALL be exactly `items[position - 1]`, with an
  automatic advance moving only to the immediately next position
- **AND** if any value cannot be verified, it SHALL say `Queue context lost.
  End this Voice session and start a new text selection.` and stop playback
- **AND** it SHALL NOT search Library, switch queues, or repair the cursor from
  conversational recollection.

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
- **AND** the next queue SHALL be selected in a new text chat before a new Voice
  session begins.

#### Scenario: Voice freezes, restarts, or opens a new chat

- **WHEN** the platform loses the current chat or the selected queue cannot be
  verified
- **THEN** the previous session SHALL be terminal
- **AND** the next session SHALL start from a fresh text-chat selection
- **AND** it SHALL NOT claim a remembered resume position or persistent pause.

### Requirement: Prefetch Does Not Change Playback State

Any article retrieval or prefetch SHALL not advance, complete, skip, or replace
the active queue item.

#### Scenario: Retrieve next article while current item plays

- **WHEN** the Project retrieves content for a future queue item
- **THEN** the current item and recorded resume position SHALL remain unchanged
- **AND** the future item SHALL not be announced until it becomes current.
