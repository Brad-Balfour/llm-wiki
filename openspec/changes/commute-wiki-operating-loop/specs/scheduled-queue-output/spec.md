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
- **AND** every produced file SHALL conform to the versioned
  `tldr-commute-queue.v1` contract, including one source-email identity and
  ordered, mutually exclusive `headline_only` and `in_depth` arrays
- **AND** the Task's managed no-external-storage prompt SHALL be stored in the
  repository so that a later prompt change is reviewable and reversible
- **AND** the completion message SHALL link to each produced artifact.

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
