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

#### Scenario: Completed playback retains a revisit cursor

- **WHEN** a completed session bundle retains `resume_source_item_id`
- **THEN** local validation SHALL accept it when it names the final verified
  current item
- **AND** it SHALL treat that field as a revisit cursor rather than evidence
  that playback is incomplete
- **AND** it SHALL reject the cursor only when it contradicts the final
  announced item.

### Requirement: Evidence-Oriented Voice Validation

Local validation SHALL account for the nondeterminism of both human speech and
LLM-generated session artifacts. Structural parsing, exact item identity, and
contradictory evidence remain safety boundaries; harmless or recoverable
variation SHALL not become a fatal error merely because it is unexpected.

#### Scenario: Unexpected state remains non-contradictory

- **WHEN** a parseable bundle contains unexpected state that preserves exact
  queue identity and does not contradict the event evidence
- **THEN** local intake SHALL accept it or retain it with a diagnostic
- **AND** it SHALL NOT discard otherwise usable session evidence solely to
  enforce a preferred static shape.

#### Scenario: Variation makes an item action unsafe to bind

- **WHEN** variation creates conflicting item identity, unsupported action
  attribution, or contradictory event order
- **THEN** local intake SHALL reject that exact claim or preserve it as an
  unresolved capture
- **AND** it SHALL retain any independent evidence that remains safe to use.

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
- **AND** local multi-bundle intake SHALL reject a distinct session that
  declares a canonical artifact filename already claimed by another supplied
  session, including when the second downloaded file has a Library numeric
  suffix.

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
- **THEN** it SHALL first reload the already named canonical queue filename from
  the Project Library
- **AND** when that exact lookup fails, it SHALL list recent Project Library
  files and select only a uniquely validated candidate whose edition date and
  newsletter type match the original request
- **AND** if it finds valid queue JSON, it SHALL emit the requested bundle with
  `recovered` integrity and only evidence-supported events
- **AND** it SHALL report export failure only if no uniquely matching validated
  queue can be recovered or no downloadable artifact can be created.

#### Scenario: Local importer recovery uses a supplied matching queue

- **WHEN** a downloaded bundle is malformed but names its selected queue file
  and Brad supplies that exact queue file to local intake
- **THEN** local intake MAY recover an explicitly marked wiki capture by mapping
  an exact item identifier or one-based legacy item position to the supplied
  queue's exact identifier, title, and URL
- **AND** the supplied queue filename SHALL exactly match the filename declared
  by the malformed bundle
- **AND** the recovered session SHALL be marked `recovered`
- **AND** the importer SHALL reject a mismatched queue, an out-of-range position,
  or an event that was not explicitly marked as a wiki capture
- **AND** the local importer SHALL not access the private ChatGPT Project
  Library; it receives the queue as a local input.

#### Scenario: Authorized agent-mediated intake retrieves original artifacts

- **WHEN** Brad invokes the full daily commute workflow with shorthand such as
  "today's commute" or explicitly asks Codex to retrieve commute artifacts
- **AND** Codex has access to Brad's signed-in ChatGPT Library session
- **THEN** Codex MAY discover and download the relevant original queue and
  session-bundle artifacts into private local intake
- **AND** Library access SHALL remain read-only unless Brad separately
  authorizes a specific mutation
- **AND** the local importer SHALL still receive only local file inputs and
  SHALL NOT authenticate to or access the private Library itself.

### Requirement: Exact Item Binding

Item-specific feedback or wiki captures SHALL refer to an exact active queue
item at the time of the user action.

#### Scenario: User corrects the current item

- **WHEN** Brad marks the current item uninterested, asks for more depth, or
  saves it for the wiki
- **THEN** the resulting event SHALL contain the current queue filename, stable
  item identifier, title, and URL copied from the queue snapshot
- **AND** it SHALL NOT be stored as a general ChatGPT Memory.

#### Scenario: Skip is normalized as next

- **WHEN** Brad asks to skip the verified current item
- **THEN** the bundle SHALL record the same `next` playback transition used for
  any other request to move forward one item
- **AND** it SHALL NOT record an `item_action` or classifier-feedback event for
  the skip request.

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

The bundle SHALL record ordered queue-state and action transitions so that an
item-specific action can be validated against the announced current item.

#### Scenario: Feedback follows an announced item

- **WHEN** an item-specific action is recorded
- **THEN** the bundle SHALL show that the same item was current and announced
  before the action
- **AND** no later `next`, repeat, interruption, or replacement transition
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

#### Scenario: Return to the previous item

- **WHEN** Brad uses any clear ordinary-English wording to return from one
  announced item to its immediate predecessor
- **THEN** the bundle SHALL normalize that intent as a `previous` transition
- **AND** the transition SHALL identify the current, departing item
- **AND** the following `item_announced` record SHALL identify the predecessor
- **AND** Brad SHALL NOT be required to speak the word `previous` or any other
  schema vocabulary.

#### Scenario: Jump directly to another queue item

- **WHEN** Brad clearly requests item N of M, names an unambiguous item, or uses
  equivalent ordinary English to select another verified queue item
- **THEN** the bundle SHALL normalize that intent as a `jump` transition
- **AND** the transition SHALL identify the current, departing item
- **AND** the following `item_announced` record SHALL identify the requested
  destination item
- **AND** the bundle SHALL NOT invent announcements or playback for intervening
  queue items.

### Requirement: Quality Incidents Do Not Require Model Diagnosis

A session bundle SHALL retain user-observed or structurally detected product
problems without requiring the model to explain their cause.

#### Scenario: Brad reports a system problem

- **WHEN** Brad reports a missing queue, invented item, audio failure, or
  incorrect interpretation
- **THEN** the bundle SHALL record an unclassified quality incident with the
  observed behavior, boundary, and available evidence pointer
- **AND** it SHALL NOT present a model diagnosis as established fact.

#### Scenario: Redundant depth promotion is detected after the commute

- **WHEN** local reconciliation detects `promote_to_in_depth` for an item that
  the embedded canonical queue already marks `in_depth`
- **THEN** it SHALL retain the original event as evidence
- **AND** it SHALL create a converted quality-incident interpretation for
  process improvement
- **AND** the contradiction SHALL NOT cause the session or its other exact
  captures to be rejected.
