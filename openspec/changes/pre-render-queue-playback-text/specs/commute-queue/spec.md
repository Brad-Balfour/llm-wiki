# Delta for Commute Queue

## ADDED Requirements

### Requirement: Queue v3 Pre-renders Default Playback

Every newly generated queue item SHALL contain one deterministic literal string for default Voice playback.

#### Scenario: Render headline-only playback

- **WHEN** queue generation emits a `headline_only` item at position `N` of `M`
- **THEN** `playback_text` SHALL equal `<N of M>. Headline only. <title>`
- **AND** it SHALL omit the item description, byline, source, and URL.

#### Scenario: Render in-depth playback

- **WHEN** queue generation emits an `in_depth` item at position `N` of `M`
- **THEN** `playback_text` SHALL equal `<N of M>. In depth. <title>\n<description>`
- **AND** it SHALL preserve title and description punctuation and quotation marks exactly.

#### Scenario: Reject drift

- **WHEN** deterministic validation reconstructs playback from position, total, depth, title, and description
- **AND** the reconstruction differs from `playback_text`
- **THEN** the queue SHALL be rejected.

### Requirement: Queue v3 Renames Summary At Its Boundary

Queue v3 SHALL name literal newsletter summary text `description` without changing upstream parser or classifier contracts.

#### Scenario: Validate a v3 item

- **WHEN** a queue declares `tldr-commute-queue.v3`
- **THEN** every item SHALL contain `description` and `playback_text`
- **AND** an item-level `summary` field SHALL be rejected.

#### Scenario: Read a historical queue

- **WHEN** local validation or bundle import receives `tldr-commute-queue.v2`
- **THEN** it SHALL continue to validate the v2 `summary` contract
- **AND** it SHALL NOT require `description` or `playback_text`
- **AND** new generation SHALL NOT emit queue v2.
