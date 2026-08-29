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

### Requirement: Queue v3 Pre-renders The Headline Sweep

Queue v3 SHALL contain one top-level deterministic string for the complete ordered headline sweep.

#### Scenario: Render the sweep

- **WHEN** queue generation has ordered all `M` items
- **THEN** each sweep line SHALL equal `<N of M>. <Headline only|In depth>. <title>`
- **AND** `sweep_playback` SHALL join those lines in item order with newline characters
- **AND** the sweep SHALL omit descriptions, authors, publications, URLs, and commentary.

#### Scenario: Reject sweep drift

- **WHEN** deterministic validation reconstructs the sweep from the ordered items
- **AND** the reconstruction differs from `sweep_playback`
- **THEN** the queue SHALL be rejected.

### Requirement: Queue v3 Carries Source Attribution

Every queue-v3 item SHALL expose author and publication metadata without inventing unavailable values.

#### Scenario: Source metadata is available

- **WHEN** the newsletter or source metadata supplies an exact author or blog/publication title
- **THEN** queue generation SHALL copy it to `author` or `publication` respectively.

#### Scenario: Source metadata is unavailable

- **WHEN** an exact author or publication is not supplied
- **THEN** the corresponding required field SHALL be JSON `null`
- **AND** queue generation SHALL NOT infer it from the sender, newsletter, URL domain, title, or general knowledge.
