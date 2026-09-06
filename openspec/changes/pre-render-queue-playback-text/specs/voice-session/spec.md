# Delta for Voice Session

## MODIFIED Requirements

### Requirement: Queue V4 Playback File Is The Default Voice Source

Voice SHALL read only pre-rendered strings from the selected v4 main file for
the sweep and ordinary item playback.

#### Scenario: Return to playback after reference use

- **WHEN** Brad requests details and then asks to continue
- **THEN** Voice SHALL reopen the same main file
- **AND** it SHALL read the requested `item_playback` exactly
- **AND** it SHALL not reuse reference or conversational text as default
  playback.

### Requirement: Literal, Interruption-Friendly Playback Is the Default

Voice SHALL read only the verified current item's pre-rendered string during default playback.

#### Scenario: Default item playback

- **WHEN** Voice presents a verified queue-v3 item
- **THEN** it SHALL verbalize the complete literal `item.playback_text` exactly
- **AND** it SHALL NOT independently assemble position, mode, title, description, byline, source, or URL
- **AND** it SHALL NOT add commentary, paraphrase, truncate, expand, or omit text
- **AND** retrieval and discussion SHALL remain available only after Brad asks.

#### Scenario: On-demand queue description

- **WHEN** Brad asks for the queue or TLDR description of a current item
- **THEN** Voice SHALL read the complete literal `item.description`
- **AND** it SHALL NOT retrieve or summarize the article unless Brad separately requests that action.

#### Scenario: Headline sweep

- **WHEN** Voice begins a verified queue-v3 session
- **THEN** it SHALL read the complete literal top-level `sweep_playback` exactly
- **AND** it SHALL NOT independently assemble positions, modes, or titles from `items`.

#### Scenario: On-demand source attribution

- **WHEN** Brad asks for the current item's author or publication
- **THEN** Voice SHALL read the corresponding literal queue field
- **AND** it SHALL report a `null` value as unavailable rather than infer one.
