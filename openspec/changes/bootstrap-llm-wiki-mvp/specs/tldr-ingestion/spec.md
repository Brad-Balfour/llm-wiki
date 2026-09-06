# Delta for TLDR Ingestion

## ADDED Requirements

### Requirement: Manual TLDR Input Paths

The system SHALL support local TLDR ingestion before unattended Gmail
automation.

#### Scenario: Ingest text-file fallback

- **WHEN** the operator runs ingestion on a text file containing a TLDR
  newsletter body
- **THEN** the system SHALL parse the file through the shared TLDR extraction
  path
- **AND** the system SHALL NOT require Gmail access for this fallback path.

#### Scenario: Use connector-assisted discovery

- **WHEN** the operator uses a Gmail connector to discover daily TLDR editions
- **THEN** candidate messages SHALL be limited to direct messages from
  `*@tldrnewsletter.com` unless Brad explicitly authorizes forwarded messages
- **AND** each candidate SHALL be confirmed from body content containing TLDR
  markers before extraction
- **AND** subject line alone SHALL NOT identify a TLDR edition.

### Requirement: Non-Sponsor Editorial Extraction

The parser SHALL extract every non-sponsor editorial item from confirmed TLDR
editions and exclude advertising and wrapper material.

#### Scenario: Extract editorial items only

- **WHEN** the parser extracts a confirmed TLDR edition containing editorial
  items, sponsors, hiring ads, referrals, subscription management, unsubscribe
  text, or forwarding wrapper text
- **THEN** the output SHALL include each non-sponsor editorial title, summary,
  URL, newsletter name, and edition date
- **AND** the output SHALL exclude primary sponsors, secondary sponsors,
  quick-link sponsors, TLDR hiring ads, referrals, subscription management,
  unsubscribe text, and forwarding wrapper text.

### Requirement: Sanitized Source Records

The system SHALL persist sanitized item-level data and SHALL NOT persist raw
Gmail bodies.

#### Scenario: Store parsed item metadata

- **WHEN** the system writes an intermediate or source record for a parsed TLDR
  item
- **THEN** the record SHALL contain item-level metadata such as source id,
  newsletter, edition date, title, summary, URL, extraction timestamp, and parser
  version
- **AND** the record SHALL NOT contain raw Gmail message bodies, credentials,
  private account data, or forwarding wrapper content.

### Requirement: Stable Source Identity

The system SHALL assign stable item identifiers and preserve validation-relevant
duplicate instances.

#### Scenario: Build stable item id

- **WHEN** an extracted TLDR item has newsletter, edition date, title, summary,
  and URL metadata
- **THEN** the system SHALL assign a stable id derived from source metadata
- **AND** connector-assisted discovery SHALL include message id in metadata when
  available
- **AND** cross-edition duplicate instances SHALL remain distinct when they are
  part of a validation set.

### Requirement: Holdout Protection

The system SHALL preserve clean validation data unless Brad explicitly changes
the validation plan.

#### Scenario: Assign classifier review material

- **WHEN** source-confirmed TLDR articles are selected for classifier review
- **THEN** the workflow SHALL record an explicit `development` or `final_check`
  assignment before tuning
- **AND** related stories SHALL not cross those assignments
- **AND** every editorial candidate SHALL be accounted for as labeled, excluded
  with a reason, or failed at a named step.

### Requirement: Parse Failures Route To Review

The ingestion workflow SHALL fail closed when TLDR parsing is ambiguous.

#### Scenario: Ambiguous item boundary

- **WHEN** extraction cannot classify a content block as editorial item, sponsor,
  or wrapper text
- **THEN** the ambiguous content SHALL be written to the review queue with enough
  context for manual inspection
- **AND** the content SHALL NOT be silently discarded or promoted to a source
  record.
