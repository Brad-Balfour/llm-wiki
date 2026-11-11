---
type: concept
title: 'General Hill-Climbing for AI Work'
aliases: ['The One Main Loop in AI']
tags: ['ai-agents', 'evaluation', 'feedback-loops']
wiki_slug: general-hill-climbing
created: 2026-11-10
updated: 2026-11-10
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261030-tldr:general-010","url":"https://danielmiessler.com/blog/general-hill-climbing"}]
---

# General Hill-Climbing for AI Work

Daniel Miessler proposes a recurring loop: describe a purpose and current and
ideal states, translate the desired outcome into measurable criteria, perform
work, evaluate the result, and iterate. If an output passes the checks but is
still unsatisfactory, the missing requirement may belong in the evaluation
itself. The goal is to assess outcomes, including business objectives, rather
than only intermediate activity.

The article suggests using deterministic checks before AI judges where
appropriate, alongside tests, rubrics, reference comparisons, and repeated
runs. The commute discussion distinguished this useful framing from a novel
evaluation technique: those individual methods are established. Refining the
criteria is part of the loop, but a changed metric should still be checked
against the actual outcome it is intended to represent.

The article's game-launch example and scores are explicitly fictional, not
evidence of measured deployment results or a demonstrated performance gain.

## Source Notes

[General Hill-Climbing: The One Main Loop in AI](https://danielmiessler.com/blog/general-hill-climbing),
Daniel Miessler, October 29, 2026. Saved from October 30 TLDR General, item
`general-010`, with discussion about evaluation novelty and illustrative
versus deployed examples.

<!-- source-item-id: 20261030-tldr:general-010 -->

## Related

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-work-metrics" %}
