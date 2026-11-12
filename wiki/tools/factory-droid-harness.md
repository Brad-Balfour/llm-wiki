---
type: tool
title: 'Factory Droid Harness'
aliases: ['Droid 1.0: Building a Frontier Harness']
tags: ['ai-agents', 'agent-harnesses', 'tool-use', 'prompt-caching']
wiki_slug: factory-droid-harness
created: 2026-11-11
updated: 2026-11-11
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261030-tldr-ai:ai-006","url":"https://factory.com/news/frontier-harness"}]
---

# Factory Droid Harness

[Factory Research](https://factory.com/news/frontier-harness) describes a model-independent harness that lets a model write
JavaScript to orchestrate tool calls in an isolated environment and return
selected results to its context. This can reduce repeated model round trips and
the volume of raw tool output the model must read.

Factory reports a 312-call Linear cleanup using two model requests and about
61,000 tokens. Its comparison with about 36 requests and 3.1 million tokens for
conventional calling is a modeled estimate, not a measured head-to-head result.
The company also describes preserving prompt-cache prefixes by appending tool
definitions, and testing harness choices across models: automatic line numbers
reduced cost for one model but increased it for two others on the cited task.
These are Factory's reported results, not general guarantees.

The article describes deterministic loop guards: a nudge after three identical
calls, a stop after six, and a stop after three turns without visible output;
polling with new results is treated differently. The commute discussion asked
for these concrete implementation details and the distinction between measured
and estimated results, which the newsletter synopsis did not fully convey.

<!-- source-item-id: 20261030-tldr-ai:ai-006 -->

## Related

- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="ramp-laminar" %}
