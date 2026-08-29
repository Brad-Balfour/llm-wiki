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
- **THEN** it SHALL bind that queue without making a detailed-playback item current
- **AND** before any summary or article commentary it SHALL announce
  `Reading: <M> items from <filename>.`, give one ordered sweep containing each
  item's literal position, reading mode, and headline, and then wait for Brad's
  post-sweep playback selection
- **AND** Brad MAY start detailed playback at any exact queue item
- **AND** an unqualified request to proceed or continue SHALL start at item 1
- **AND** it SHALL NOT begin any item's base playback before completing the sweep
- **AND** it SHALL NOT insert items from another queue
- **AND** the resulting canonical-filename lookup SHALL occur only for session
  start, not as a fallback after another queue has become active.

#### Scenario: Finish the selected queue

- **WHEN** Voice completes item `M of M` in the selected queue
- **THEN** it SHALL keep that final item current through the same approximately
  five-second interruption-friendly gap used after every other item
- **AND** any clear ordinary-English intent to save, explore, repeat, or pause
  during that gap, or after the finished announcement, SHALL apply to the final item
  rather than begin export
- **AND** after the gap it SHALL announce that canonical filename is finished
  and wait for Brad's instruction
- **AND** it SHALL create the downloadable session bundle only after a clear
  ordinary-English request to end the commute or create the bundle
- **AND** it SHALL NOT ask which queue Brad would like next or automatically
  start another queue
- **AND** after a visible bundle download, a later queue request SHALL start a
  new session
- **AND** if bundle creation fails, it SHALL report that failure and SHALL NOT
  begin another queue.

#### Scenario: Verify before speaking

- **WHEN** Voice is about to announce an item
- **THEN** it SHALL silently verify the selected filename, literal `N of M`
  phrase, source ID, title, URL, and reading mode against the selected queue
- **AND** because every valid v3 item contains a URL, it SHALL treat an
  unavailable URL or reading mode as lost queue context rather than claim the
  item has no URL or infer a mode from conversational memory
- **AND** the current item SHALL be exactly `items[position - 1]`, with an
  automatic advance moving only to the immediately next position
- **AND** if the selected queue is lost, a new/restarted chat lacks a fresh
  date/newsletter or exact-filename request, or an identified item conflicts
  with it, it SHALL say `Queue context lost. End this Voice session and start
a new queue.` and stop playback
- **AND** after reading starts it SHALL NOT search Library, switch
  queues, or repair the cursor from conversational recollection.

### Requirement: Literal, Interruption-Friendly Playback Is the Default

Voice SHALL present only the verified current item and keep it current until
Brad expresses another intent.

#### Scenario: Normal playback

- **WHEN** Voice presents the verified current item
- **THEN** Voice SHALL read only the current item's validated `playback_text`
  for default playback
- **AND** for `headline_only`, `playback_text` SHALL contain only the literal
  `N of M` phrase, reading mode, and exact queue headline
- **AND** for `in_depth`, `playback_text` SHALL also contain the complete TLDR
  description exactly as written
- **AND** it SHALL retrieve or discuss the linked article only after Brad
  requests more detail
- **AND** it SHALL make an approximately five-second interruption-friendly gap
  and keep the item current
- **AND** it SHALL NOT auto-advance, ask whether Brad wants to continue, or
  narrate a routine transition.

The five-second gap is a prompt-level target, not a claim that Standard Voice
can provide a measured timer or capture every overlapping interruption.

#### Scenario: Base playback uses pre-rendered queue text literally

- **WHEN** Voice presents any verified queue item
- **THEN** it SHALL read `item.playback_text` exactly as written
- **AND** it SHALL NOT assemble default playback from `item.title`,
  `item.description`, or other item fields
- **AND** it SHALL NOT paraphrase, truncate, expand, combine, or select only
  part of a field it reads
- **AND** `consumption_depth` SHALL remain the literal switch between those two
  base-reading shapes, not permission to rewrite queue text.

#### Scenario: Brad requests the queue summary for a headline-only item

- **WHEN** a verified `headline_only` item is current
- **AND** Brad asks for the TLDR summary, queue summary, or summary directly
  from the queue
- **THEN** Voice SHALL read that item's complete literal `item.description`
- **AND** it SHALL NOT paraphrase the description, retrieve the article, or
  substitute article text unless Brad separately requests article retrieval.

#### Scenario: Brad navigates in ordinary English

- **WHEN** Brad clearly expresses a playback intent in ordinary English,
  including a synonym, paraphrase, named item, or position reference
- **THEN** Voice SHALL perform that intent against the verified active queue
- **AND** it SHALL normalize the action into internal event vocabulary without
  requiring Brad to say an enum value, schema term, or memorized phrase
- **AND** examples in Project instructions SHALL be illustrative rather than an
  exhaustive command grammar
- **AND** a clear request to skip SHALL have exactly the same meaning and
  recorded `next` transition as any other request to move forward one item
- **AND** a clear request to return from the current item to its immediate
  predecessor SHALL make that predecessor current
- **AND** a clear request for item N of M, a named item, or another unambiguous
  queue reference SHALL make that verified item current without announcing or
  marking intervening items as heard.

#### Scenario: Brad chooses a post-sweep starting point

- **WHEN** the ordered headline sweep is complete and Brad selects any exact
  queue item
- **THEN** Voice SHALL make that item the first current detailed-playback item
- **AND** it SHALL NOT announce or mark earlier queue positions as visited
- **AND** the queue's ordered `items` array SHALL remain canonical identity and
  position metadata rather than a required visitation sequence.

#### Scenario: Voice combines spoken intents

- **WHEN** Voice combines multiple spoken fragments into one transcript
- **THEN** it SHALL follow the final clear commute intent in that transcript
- **AND** it SHALL NOT reload or replace the active queue because an earlier
  fragment names a file
- **AND** if no final intent is clear, it SHALL ask a short plain-English
  clarification about the intended action or item without listing allowed
  commands.

#### Scenario: Brad gives feedback during playback

- **WHEN** Brad explicitly asks Voice to note classifier feedback, reports a
  defect, or corrects an interpretation
- **THEN** Voice SHALL retain the appropriate event or incident and acknowledge
  it in two or three words
- **AND** it SHALL bind item-specific feedback only to a verified current item;
  otherwise it SHALL retain an unresolved capture or a general quality incident
- **AND** it SHALL NOT repeat, summarize, diagnose, apologize at length, or ask
  a follow-up about that feedback
- **AND** it SHALL keep the verified item current and wait for Brad's next
  navigation or other intent.

#### Scenario: Playback behavior is not implicit classifier feedback

- **WHEN** Brad asks for a headline-only item's summary or interrupts a summary
  before it finishes
- **THEN** Voice SHALL NOT infer or record classifier feedback from that action.

#### Scenario: Switch newsletters

- **WHEN** Brad wants to hear a different queue
- **THEN** the current Voice session SHALL either export successfully or be
  intentionally abandoned
- **AND** the next queue SHALL start from an exact filename or unambiguous
  date/newsletter request in a new session before Voice playback begins.

#### Scenario: Voice freezes, restarts, or opens a new chat

- **WHEN** the platform loses the current chat or the active queue cannot be
  verified
- **THEN** the previous session SHALL be terminal
- **AND** the next session SHALL start from a fresh filename or date/newsletter
  request
- **AND** it SHALL NOT claim a remembered resume position or persistent pause.

### Requirement: Prefetch Does Not Change Playback State

Any article retrieval or prefetch SHALL not advance, complete, skip, or replace
the active queue item.

#### Scenario: Retrieve next article while current item plays

- **WHEN** the Project retrieves content for a future queue item
- **THEN** the current item and recorded resume position SHALL remain unchanged
- **AND** the future item SHALL not be announced until it becomes current.
