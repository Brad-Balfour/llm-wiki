## Why

The manual ChatGPT commute path has proven that the Project can create real
dated queues, one-queue Voice sessions can produce usable bundles, and a public
GitHub-Pages wiki is a viable reading surface. Scheduled Tasks have also created
real queues, but are not a reliable default: July 21-24 runs found the expected
Gmail messages and then failed every artifact-writing path, while a manual
same-Project control succeeded on July 24.

The commute has exposed a separate boundary problem: long Voice conversations
cannot be treated as reliable mutable state. They have lost loaded queues,
invented items, misbound feedback, and claimed writes to a session ledger that
the resulting artifact did not contain.

The current bootstrap change treats commute work as one broad capability. That
is insufficient for the product now being tested: a car interaction feeds a
maintained wiki and two learning loops. This change makes the user journey,
artifacts, failure behavior, and ownership boundaries explicit before prompt or
runtime changes are made.

## What Changes

- Define the six-boundary operating loop from scheduled queue creation through
  a wiki-maintainer PR.
- Replace the assumption of one continuous multi-queue Voice conversation with
  a provisional operating model: one named queue per Voice session, selected
  from the live Project Library by exact filename or an unambiguous
  date/newsletter request.
- Define a new self-contained session-bundle contract that does not require a
  durable mutable ChatGPT ledger to be trusted.
- Require explicit recovery records for unresolved captures instead of guessed
  item identities or reconstructed claims of complete logs.
- Define a single local import run that accepts one or more session bundles, so
  switching queues does not require manual reconciliation at home.
- Establish the wiki maintainer as a read-existing-wiki, retrieve-source,
  direct-to-PR maintenance pass rather than a one-source/one-page compiler.
- Capture commute quality incidents and exact feedback corrections as inputs to
  separate reliability and classifier-calibration loops.

## Capabilities

### New Capabilities

- `scheduled-queue-output`: observable, non-placeholder queue-generation
  outcomes for the ChatGPT Task integration.
- `queue-selection`: a date/newsletter-to-filename Project-Library boundary
  that binds one unambiguously named queue to a Voice session.
- `voice-session`: one active queue and predictable restart/switch behavior.
- `session-bundle`: exact session events, recovery declarations, and quality
  incidents in a self-contained end-of-session artifact.
- `commute-import`: one local reconciliation run for one or more bundles.
- `wiki-maintenance`: source retrieval and existing-wiki-aware maintenance in a
  Git PR.

### Modified Capabilities

- `commute-queue`: the existing mutable-ledger assumptions are superseded for
  new work by the session-bundle requirements in this change. Retired queue-v1
  files are not supported by the successor path.
- `feedback-labels`: exact in-session binding and quality-incident capture
  become prerequisites for later feedback aggregation.
- `wiki-compilation`: direct maintenance PRs become the intended knowledge
  update path; existing compiler behavior remains available until replaced by
  an implemented, tested migration.

## Non-Goals

- A custom Realtime/Voice API agent.
- Programmatic access to ChatGPT Project Library or guaranteed platform support
  for updating a Library file during a Voice session.
- Unattended Gmail ingestion outside the ChatGPT Task/manual Project paths.
- A custom review UI, Drive archive, or a new external database.
- Auto-merging knowledge-maintenance PRs before their usefulness and failure
  modes are established.
- Rewriting existing prompts, schemas, or runtime behavior in this planning
  change.

## Impact

- Affects `chatgpt-project/`, `schema/`, `src/commute/`, `src/wiki/`, test
  fixtures, and operator documentation in follow-on implementation changes.
- Leaves the manual Project queue-generation control intact, preserves the
  scheduled path as a convenience producer, and makes a real downloadable
  artifact—not scheduler status—the acceptance boundary.
- Creates a successor planning contract; it does not mark existing bootstrap
  implementation tasks complete or silently alter deployed behavior.
- Includes an explicit compatibility map so reviewers and future agents can
  distinguish retained bootstrap behavior, revised behavior, legacy-compatible
  implementation, and historical records.
- Keeps content safeguards, but replaces user-facing approval fields and
  before-write confirmations with direct maintenance PRs and ordinary Git review.
