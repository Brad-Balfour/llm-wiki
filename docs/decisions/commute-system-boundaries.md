# Commute system boundaries

Status: accepted. Decision history: issue
[#130](https://github.com/Brad-Balfour/llm-wiki/issues/130) and implementation
PRs [#127](https://github.com/Brad-Balfour/llm-wiki/pull/127),
[#128](https://github.com/Brad-Balfour/llm-wiki/pull/128),
[#129](https://github.com/Brad-Balfour/llm-wiki/pull/129),
[#131](https://github.com/Brad-Balfour/llm-wiki/pull/131),
[#132](https://github.com/Brad-Balfour/llm-wiki/pull/132), and
[#133](https://github.com/Brad-Balfour/llm-wiki/pull/133).

These reasons are easy to lose when reading schemas and code alone:

- Keep the interest profile, classifier mechanics, and routing separate because
  they change at different rates. Classifier output is source-neutral and
  score-first; application code owns routes.
- Keep one active queue and one canonical playback cursor per Voice session.
  Prepared literal strings avoid projection drift during playback.
- Treat the final self-contained session bundle, not conversational memory or a
  live ledger, as the local import boundary. A Voice restart is terminal unless
  evidence in a bundle proves continuity.
- Preserve unresolved and partial evidence explicitly. Integrity means coverage
  by traceable evidence, not model confidence, and ordered events are required
  to bind actions to exact items.
- Process multiple bundles as one home-side operation while validating each one
  independently. Product reliability incidents and classifier calibration are
  separate evidence loops.
- An exact `wiki_this` action nominates direct, source-grounded wiki maintenance.
  The pull request is the review, rollback, and publication boundary; content
  safeguards are deterministic checks, not an extra approval ceremony.
- Use file artifacts and GitHub Pages before adding a custom UI, local producer,
  or custom realtime voice system. Platform capability claims require observed
  or published evidence.

The schemas, prompts, source, and focused tests are authoritative for exact
current behavior. This record explains the boundaries; it does not duplicate
their field-level contracts.
