# Delta for Voice Session

## MODIFIED Requirements

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
