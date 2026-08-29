# Delta for Scheduled Queue Output

## ADDED Requirements

### Requirement: Observable Queue Artifact Output

The scheduled queue-generation workflow SHALL create one real downloadable
queue artifact for every qualifying TLDR source email delivered that day.

#### Scenario: Successful scheduled queue run

- **WHEN** the Task finds qualifying TLDR emails and queue preflight succeeds
- **THEN** it SHALL produce one dated `.txt` queue file per source email
- **AND** every produced file SHALL contain parseable queue content rather than
  a filename, placeholder, or reconstruction claim
- **AND** after the coupled queue-v3 trial deployment, every newly generated
  file SHALL conform to the `tldr-commute-queue.v3` contract, including one
  source-email identity, one ordered `items` array whose literal playback
  phrases are contiguous from `1 of M` through `M of M`, and validated
  `playback_text` and `sweep_playback`
- **AND** the Task's managed no-external-storage prompt SHALL be stored in the
  repository so that a later prompt change is reviewable and reversible
- **AND** the completion message SHALL link to each produced artifact.

#### Scenario: v3 queue preserves two reading styles without two cursors

- **WHEN** the Task classifies a source email into headline-only and in-depth
  reading styles
- **THEN** it SHALL put every selected item in the one canonical `items` array
- **AND** each item SHALL carry the existing `consumption_depth` tag that
  determines its reading style
- **AND** it SHALL NOT emit `headline_only`, `in_depth`, `source_order`, or a
  newsletter-position field in a new v3 queue.

#### Scenario: coupled v3 trial cutover

- **WHEN** Brad replaces the managed Task prompt and uploads the v3 schema,
  generation instructions, and Voice instructions together in
  `LLM-Wiki-Car`
- **THEN** newly generated queues and new Voice session bundles SHALL use v3
- **AND** the local validator and session-bundle importer SHALL continue to
  accept unchanged, already-downloaded v2 artifacts without treating v2 as a
  live generation target.

#### Scenario: Artifact creation fails

- **WHEN** a queue cannot be created as a real downloadable artifact
- **THEN** the Task SHALL identify the missing expected filename
- **AND** it SHALL NOT create a placeholder artifact
- **AND** it SHALL NOT report the run as a successful queue-generation result.

### Requirement: No External Archive Fallback

The Task SHALL not use Google Drive, another external storage connector, or
folder creation to satisfy queue persistence.

#### Scenario: Platform cannot persist a Library side effect

- **WHEN** the platform does not retain a generated artifact in Project Library
- **THEN** the Task SHALL still provide the real downloadable artifact or report
  failure
- **AND** it SHALL NOT request storage permission from an unrelated connector.
