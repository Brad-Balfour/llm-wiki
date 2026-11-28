---
type: concept
title: 'Self-Improving Agent Skills'
aliases: []
tags: ['ai-agents', 'evaluation', 'procedural-memory']
wiki_slug: self-improving-agent-skills
created: 2026-11-27
updated: 2026-11-27
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261120-tldr-ai:ai-007","url":"https://www.perplexity.ai/hub/blog/self-improving-skills"}]
---

# Self-Improving Agent Skills

The commute discussion asked what a team could reuse from Perplexity's product announcement. Its architecture treats reusable instructions as procedural memory. A background agent reviews session traces, including tool outcomes and user corrections, then proposes a skill change with supporting evidence. Verification precedes activation, and later sessions supply evidence about the revised procedure. The underlying model weights are fixed during these updates.

Perplexity uses different gates for personal and shared skills. Creating a personal skill requires two independent examples of the recurring behavior. One grounded example can justify revising an existing skill. Deterministic checks validate proposed changes and an LLM judge audits a sample. Built-in changes must pass paired replay on held-out failures and successful cases, followed by an engineer's approval.

## Source Notes

### [Self-improving skills](https://www.perplexity.ai/hub/blog/self-improving-skills)

<!-- source-item-id: 20261120-tldr-ai:ai-007 -->

Perplexity reports an eight-week randomized production test of automatic personal-skill improvement. Tool-call failures fell 11% across all activity and about 7% after excluding background runs. Threads with medium or high dissatisfaction per user fell 7.6%, and the study detected no change in cost or response time. A separate offline experiment across 16 paired instances reported task success of 43.8% without generated skills and 62.5% with them. That smaller experiment measured repeated tasks in nine task families. [Readable first-party edition](https://www.perplexity.ai/en-GB/hub/blog/self-improving-skills)

## Related

- {% include wiki-related-link.md slug="prompt-deployment-gates" %}
