# Fixture Layout

Fixtures are intentionally small and sanitized. Do not commit raw Gmail bodies,
private Range.com notes, credentials, forwarding wrapper text, or July 3, 2026
and later direct TLDR emails unless Brad explicitly changes the holdout plan.

Directories:

- `tldr/source-text/`: sanitized TLDR-like source text for parser tests.
- `expected/parser/`: expected parsed item records.
- `expected/classifier/`: expected validated classifier records and invalid-output
  cases.
- `expected/routing/`: expected derived route records.
- `expected/queue/`: expected commute queue output.
- `expected/feedback/`: expected feedback label records.
- `expected/wiki/`: expected OKF-style wiki markdown output.
- `commute-bundles/`: sanitized, versioned session-bundle examples used to test
  exact queue binding, recovery states, and integrity validation.

`commute-bundles/session-contract-cases.json` is a mutation manifest over the
sanitized valid partial bundle. It keeps each regression small and reviewable
while exercising the resulting complete fixture through both the session
validator and multi-bundle importer. The cases cover terminal restart,
unresolved and duplicate recognition, false completeness, invented or
misbound items, playback-order drift, same-name/different-content queues,
same-day exports, Library suffixes, and explicit export failure.

Use stable source item ids and keep cross-edition duplicate instances distinct
when a fixture is intended to exercise validation behavior.

`wiki-maintenance-cases.json` covers deterministic retrieval/result-recording
boundaries and manual PR review expectations for inaccessible URLs, duplicate
concepts, material updates to existing concepts, and useful link-only changes.
The semantic wiki decision remains agent-driven and is reviewed in the
resulting PR.
