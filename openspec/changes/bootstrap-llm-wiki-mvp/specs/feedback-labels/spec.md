# Delta for Feedback Labels

## ADDED Requirements

### Requirement: Feedback Labels As Data

The system SHALL store Brad's corrections as structured label data rather than
rewriting the canonical profile after every correction.

#### Scenario: Record correction label

- **WHEN** Brad corrects an item's interest, depth, or route
- **THEN** the system SHALL append a structured feedback label
- **AND** the label SHALL include source item id, correction type, original
  predicted interest, original interest score, original predicted depth, original
  depth score, corrected interest where applicable, corrected depth where
  applicable, corrected route where applicable, reason, timestamp, profile
  version, prompt version, provider, and model.

### Requirement: Distinct Correction Types

Feedback labels SHALL distinguish interest, depth, and routing corrections.

#### Scenario: Save depth-only correction

- **WHEN** Brad agrees an item is interesting but says it should have been quick
  read instead of discussed
- **THEN** the label SHALL record a depth or routing correction
- **AND** the label SHALL NOT change the original interest label unless Brad also
  corrected interest.

### Requirement: Cadenced Profile Updates

The canonical interest profile SHALL be patched only from repeated, high-harm,
or clearly explanatory patterns.

#### Scenario: Single one-off disagreement

- **WHEN** a single correction label does not match a known repeated pattern
- **THEN** the system SHALL keep the correction as data
- **AND** the system SHALL NOT automatically rewrite
  `schema/interest-profile.md`.

#### Scenario: Repeated high-harm pattern

- **WHEN** multiple labels reveal a repeated false-skip pattern or another
  high-harm miss during scheduled profile review
- **THEN** a profile patch proposal SHALL cite the supporting labels and affected
  profile, prompt, and model versions
- **AND** the patch SHALL remain reviewable before becoming canonical.

### Requirement: Future Classifier Context

Recent feedback SHALL be available for future classification context without
mutating the canonical profile immediately.

#### Scenario: Load recent corrections

- **WHEN** the next day's classifier context is prepared from recent
  non-sensitive feedback labels
- **THEN** the preparation SHALL verify each required private backfill against
  its committed inventory, checksum, schema, and immutable label identifiers
- **AND** a missing or invalid required backfill SHALL fail observably instead
  of being treated as an empty correction set
- **THEN** selected corrections SHALL be available as examples or lightweight
  routing overrides
- **AND** the underlying labels SHALL remain preserved for audit and profile
  review
- **AND** original scores SHALL remain available to distinguish boundary
  corrections from high-confidence misses.

### Requirement: Blind Validation Workflow

Validation labels SHALL be collected without exposing predictions to Brad.

#### Scenario: Create future holdout predictions

- **WHEN** predictions are generated for a future TLDR holdout batch
- **THEN** predictions SHALL be saved to a fixed file before Brad labels the
  batch
- **AND** the saved predictions SHALL include interest and depth scores as well
  as derived labels
- **AND** the label collection workflow SHALL NOT expose those predictions.

#### Scenario: Protect July 3 plus holdout

- **WHEN** July 3, 2026 or later direct TLDR emails are available for examples,
  prompt tuning, profile updates, or tests
- **THEN** those emails SHALL remain the next clean validation holdout by default
- **AND** they SHALL NOT be used for tuning unless Brad explicitly changes that
  plan.

### Requirement: Product-Harm Review

Feedback review SHALL analyze corrections by product harm.

#### Scenario: Summarize correction batch

- **WHEN** a batch of feedback labels or validation comparison results is
  reviewed
- **THEN** the summary SHALL identify false skips, false discusses, pacing
  errors, and lower-harm disagreements
- **AND** false skips SHALL receive the highest priority for profile or prompt
  adjustment
- **AND** score distance from the configured threshold SHALL be used to separate
  near-boundary misses from high-confidence product-harm misses.

### Requirement: Sensitive Feedback Handling

Feedback storage SHALL avoid committing sensitive or private content.

#### Scenario: Feedback includes private note

- **WHEN** a correction reason or voice note includes private Range.com context,
  sensitive personal content, credentials, or raw email text
- **THEN** the sensitive content SHALL be kept out of public committed files
- **AND** a sanitized label or review placeholder SHALL be used when a public
  artifact needs to reference the correction.
