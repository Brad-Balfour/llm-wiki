# Delta for Classifier Routing

## ADDED Requirements

### Requirement: Classifier Accepts Verified Attribution

The classifier input SHALL include verified author/publication metadata without
treating lookup outcomes as preference evidence.

#### Scenario: Attribution lookup is absent or fails

- **WHEN** generation records `no_authors_listed` or `lookup_failed`
- **THEN** the classifier input SHALL use a null author plus the explicit status
- **AND** the status or error text SHALL NOT change interest or depth
- **AND** classifier output SHALL remain source-neutral.

### Requirement: Split Production Profile Files

The MVP SHALL separate interest content, classifier mechanics, and routing rules
into distinct schema files.

#### Scenario: Create canonical profile files

- **WHEN** the schema layer is initialized
- **THEN** `schema/interest-profile.md` SHALL contain Brad's candidate v2.1
  interest profile
- **AND** `schema/classifier-instructions.md` SHALL contain scoring mechanics,
  output schema, fail-closed validation rules, and validation methodology
- **AND** `schema/routing-rules.md` SHALL contain downstream derivation rules for
  commute, wiki, stream-log, review, and discard behavior.

#### Scenario: Build v2.1 interest profile

- **WHEN** `schema/interest-profile.md` is authored
- **THEN** the profile SHALL preserve the accepted v1.4 scope and thresholds
- **AND** Martin Fowler SHALL have a high-interest, in-depth default
- **AND** Addy Osmani SHALL have a strong interest prior without a blanket depth
  override
- **AND** robotics and self-driving SHALL explicitly include Tesla and Waymo
- **AND** practical-agent, software-craft, battery, Bun, and DuckDB corrections
  SHALL be expressed as reusable category boundaries rather than title matches.

### Requirement: Source-Neutral Classifier Output

The classifier SHALL emit only a source-neutral request reference plus interest
and depth classification fields.

#### Scenario: Accept valid classification output

- **WHEN** the classifier returns a result for a parsed TLDR item
- **THEN** the result SHALL include a source-neutral `classifier_item_id` that
  matches one input item for the classifier call
- **AND** the result SHALL include exactly one `interest_level` of
  `interested`, `maybe`, or `uninterested`
- **AND** the result SHALL include `interest_score`, `consumption_depth`,
  `depth_score`, `signals`, and `reason`
- **AND** `consumption_depth` SHALL be `headline_only` or `in_depth`.

#### Scenario: Use score-first labels

- **WHEN** classifier output is validated
- **THEN** `interest_score` and `depth_score` SHALL be treated as continuous
  calibration values
- **AND** `interest_level` and `consumption_depth` SHALL be derived from
  configured score bands or validated for consistency with those bands
- **AND** configured score bands SHALL be gap-free numeric comparisons, using
  half-open thresholds where ranges meet unless score precision is explicitly
  constrained before validation
- **AND** inconsistent score/label pairs SHALL be rejected, quarantined, or
  normalized according to the configured validation policy before routing.

#### Scenario: Return one record per item

- **WHEN** the runtime classifies a batch of parsed TLDR items
- **THEN** the classifier result SHALL contain one classification record per
  input item
- **AND** each record SHALL include the matching source-neutral
  `classifier_item_id`
- **AND** application validation SHALL verify that output ids are complete,
  unique, and known before reconciling records to the input items
- **AND** each record SHALL be validated independently before routing.

#### Scenario: Reject downstream behavior fields

- **WHEN** model output includes `voice_behavior`, `route`, `wiki_destination`,
  or another downstream behavior field
- **THEN** application validation SHALL reject or quarantine the output according
  to fail-closed policy
- **AND** downstream behavior fields SHALL NOT be accepted as classifier truth.

### Requirement: Fail-Closed Validation

The application SHALL validate classifier output before routing or queue writes.

#### Scenario: Invalid classifier record

- **WHEN** a classifier output has an invalid enum value, missing required field,
  non-numeric score, score outside `0.0` to `1.0`, malformed signals, or
  malformed reason
- **THEN** the item SHALL be routed to review with validation error metadata
- **AND** the item SHALL NOT be routed automatically to discard, stream log,
  commute queue, or wiki source output.

### Requirement: Application-Owned Routing

The system SHALL derive routing in application code from validated
source-neutral classification.

#### Scenario: Derive commute behavior

- **WHEN** routing code derives commute behavior from a validated classification
- **THEN** `uninterested` SHALL derive `skip`
- **AND** `interested + headline_only` SHALL derive `quick_read`
- **AND** `interested + in_depth` SHALL derive `discuss`
- **AND** `maybe + headline_only` SHALL derive optional `quick_read`
- **AND** `maybe + in_depth` SHALL derive optional `discuss` or quick teaser.

#### Scenario: Derive wiki behavior

- **WHEN** routing code derives wiki behavior from a validated classification
- **THEN** `uninterested` SHALL derive discard
- **AND** `interested + headline_only` SHALL derive stream-log-only
- **AND** `interested + in_depth` SHALL derive full source/write candidate
- **AND** `maybe + headline_only` SHALL derive stream log or review queue
- **AND** `maybe + in_depth` SHALL derive review queue by default.

### Requirement: Provider-Neutral Runtime

The classifier runtime SHALL keep provider and model selection in configuration.

#### Scenario: Configure provider

- **WHEN** the MVP runs classification
- **THEN** the selected provider, model id, prompt version, and profile version
  SHALL be loaded from configuration or explicit runtime options
- **AND** parser, routing, queue, feedback, and wiki compile logic SHALL NOT
  hard-code a single LLM provider.

#### Scenario: Configure classifier batch size

- **WHEN** the MVP runs classification
- **THEN** classifier batch size SHALL be supplied by configuration or explicit
  runtime options
- **AND** batch size `1` SHALL remain valid for early correctness testing
- **AND** larger batch sizes SHALL be supported as a cost and latency control
  once validation and quarantine behavior are stable.

### Requirement: Product-Harm Metrics

Classifier evaluation SHALL prioritize product harm as well as exact label
match.

#### Scenario: Compare predictions with labels

- **WHEN** fixed predictions are compared with Brad's blind labels
- **THEN** misses SHALL be categorized at least as false skips, false discusses,
  pacing errors, and lower-harm label disagreements
- **AND** false skips SHALL be treated as the highest-priority product harm
- **AND** analysis SHALL use original `interest_score` and `depth_score` values
  to distinguish near-boundary disagreements from high-confidence misses
- **AND** score distributions SHALL be available for future threshold tuning
  without regenerating the original predictions.

#### Scenario: Run the lightweight blind review

- **WHEN** development or final-check inventory is prepared
- **THEN** one prediction-only input SHALL be produced without label data
- **AND** the labeling page SHALL contain no baseline or candidate prediction
  data
- **AND** exact newsletter copies SHALL remain auditable without inflating
  distinct-article comparison counts
- **AND** missing labels or predictions SHALL remain explicitly pending.
