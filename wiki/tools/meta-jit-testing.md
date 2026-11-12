---
type: tool
title: 'Meta Just-in-Time Testing'
aliases: ['JiTTesting', 'How Meta Catches Bugs Before Code Ships']
tags: ['testing', 'software-quality', 'llm', 'regression-testing']
wiki_slug: meta-jit-testing
created: 2026-11-11
updated: 2026-11-11
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261030-tldr-ai:ai-007","url":"https://engineering.fb.com/2026/10/29/security/catching-bugs-before-they-land-jittestings-human-on-the-loop-approach-at-full-scale/"}]
---

# Meta Just-in-Time Testing

[Meta's JiTTesting](https://engineering.fb.com/2026/10/29/security/catching-bugs-before-they-land-jittestings-human-on-the-loop-approach-at-full-scale/) generates executable tests around changes to conventional
application code. It uses intent-aware analysis and mutation-guided methods,
then combines deterministic and model-based filtering with selective human
review to assess failures. Meta reports a 60% true-positive rate and 74 serious
privacy bugs found in the first half of 2026; these are company-reported figures.

The commute discussion distinguished this use of AI to test ordinary code from
evaluating nondeterministic AI agents. The article does not establish a complete
breakdown of unit, integration, and end-to-end test coverage, so the system
should not be assumed to cover each level.

<!-- source-item-id: 20261030-tldr-ai:ai-007 -->
