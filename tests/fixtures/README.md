# Fixture Layout

Fixtures are intentionally small synthetic or derived records. Do not commit
Brad's PII, credentials, or raw Gmail delivery wrappers. Public TLDR article
content does not need redaction; parser fixtures use small representative
excerpts rather than whole delivery messages. July 3, 2026 and later direct
TLDR emails remain held out for evaluation unless Brad changes that plan; this
is an evaluation boundary, not a claim that the newsletters are private.

Directories:

- `tldr/source-text/`: small TLDR-like excerpts for parser tests.
- `expected/parser/`: expected parsed item records.
- `expected/classifier/`: expected validated classifier records and invalid-output
  cases.
- `expected/routing/`: expected derived route records.
- `expected/queue/`: expected commute queue output.
- `expected/feedback/`: expected feedback label records.
- `expected/wiki/`: expected OKF-style wiki markdown output.
- `commute-bundles/`: synthetic, versioned session-bundle examples used to test
  exact queue binding, recovery states, and integrity validation.

`commute-bundles/session-contract-cases.json` is a mutation manifest over the
synthetic valid partial bundle. It keeps each regression small and reviewable
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
