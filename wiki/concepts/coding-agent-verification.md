---
type: concept
title: 'Coding Agent Verification'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: coding-agent-verification
created: 2026-11-23
updated: 2026-11-23
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261117-tldr-ai:ai-014","url":"https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/"}]
---

# Coding Agent Verification

[Addy Osmani's account of Claude Code verification](https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/)
describes how a team gives coding agents evidence that a change works. The
commute worked through each mechanism and asked where to run checks, what a
commit gate actually proves, and how a team can tell whether its reviewer
finds meaningful defects.

## Choosing what to test

- **End-to-end tests** exercise a user flow in a running system. A browser,
  mobile simulator or local API harness provides evidence tied to a specific
  failed step. A fast, reliable project verification skill can encode how
  to start the app, run the flow and inspect the result.
- **Property-based tests** generate inputs and check a property across them.
  Examples discussed include a round trip through serialization, the
  invariant that normalization is idempotent, and equivalence with a simple
  reference implementation. The article advises running cheap checks early
  and heavier tests before committing. It gives no runtime budget or
  dedicated CI stage for property-based tests.
- **Differential tests** feed the same generated or representative inputs to
  two implementations and compare results. An existing implementation can
  serve as the oracle for a migration. Normalize irrelevant output
  differences and explicitly record intended changes. A matching result
  shows preservation of behavior for the tested inputs.

## Review and commit evidence

Osmani reports that owners write checks and that Claude escalates failures
after three unsuccessful rounds. The team has 39 reliability checks and
typically selects three to ten based on the diff. One checks that a modified
message format can still load older transcripts through `--resume`. The
article gives no implementation details for the trigger matcher.

The team tunes one primary reviewer and carries earlier findings into later
rounds. Managed Claude Code Review reads `REVIEW.md` from the base or default
branch. `CLAUDE.md` can guide ordinary agent work, and local review commands
need their own verified configuration. Use an independent rule source and
attach evidence to the commit reviewed. Run inexpensive tests, builds and
lint checks before opening a pull request.

The described commit stamp records the verification performed, including an
explicit absence. The session gate looks for `/code-review` or `/verify`;
a recorded invocation by itself supplies no evidence of a passing result.
The gate can be off, log what it would block in observe mode, or block in
enforce mode. A commit can carry an explanation. After two blocked attempts
in a session, the next can proceed under the team's escape rule.

## Measuring and improving the checks

The team replays historical incidents at their original repository state
using a short answer key for the actual defect. Stable, size-matched merged
changes help measure over-flagging. Hold-out cases stay separate from tuning
cases. Checking recall at each stage shows whether a candidate defect was
discarded later. The commute distinguished severity from provenance: a
pre-existing defect can be serious even when the current author did not
introduce it.

Osmani describes two feedback paths. A repeated, diff-visible pattern from
at least two PRs can become a rule after three agents challenge it and a
human approves it. For a known incident, two of three independent bug finders
must reproduce the finding to count it as detectable in the replay. Missing
a detectable bug on a small diff can justify a targeted rule.

The article says to investigate flaky tests and document a deletion if the
cause cannot be found. The commute called out the coverage cost of deleting
a check. Keeping the suite and instructions small works best when each
retained check has a clear purpose and known evidence. The human owner's job
is to define the acceptance criteria and assess the resulting evidence.

## Related

- {% include wiki-related-link.md slug="agent-memory-and-verification" %}

<!-- source-item-id: 20261117-tldr-ai:ai-014 -->
