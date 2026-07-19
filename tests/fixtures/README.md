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

Use stable source item ids and keep cross-edition duplicate instances distinct
when a fixture is intended to exercise validation behavior.
