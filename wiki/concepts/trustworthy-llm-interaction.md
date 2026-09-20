---
type: concept
title: 'Trustworthy LLM Interaction'
# prettier-ignore
aliases: ["LLM trust", "Confident fabrication"]
# prettier-ignore
tags: ["ai-products", "trust", "user-experience", "verification"]
wiki_slug: trustworthy-llm-interaction
created: 2026-09-20
updated: 2026-09-20
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a0b43ef29d5c18c-06","url":"https://martinfowler.com/articles/2026-dont-like-llms.html"}]
---

# Trustworthy LLM Interaction

Usefulness does not erase the interaction cost of confident fabrication. A
system earns durable trust by making evidence, uncertainty, and correction
visible where decisions are made.

## Key Ideas

- Helpful answers delivered with the same confidence as invented claims create
  a trust debt that users must repay through verification.
- Human-like tone can amplify that debt when it implies judgment or integrity
  that the system cannot support.
- Evidence links, clear provenance, bounded claims, and correction histories
  make assistance more inspectable than reassuring language alone.
- Users can rationally adopt a useful tool while remaining wary of its
  incentives, failure modes, and social effects.

## Source Notes

### [I don't like LLMs](https://martinfowler.com/articles/2026-dont-like-llms.html)

<!-- source-item-id: 1a0b43ef29d5c18c-06 -->

Martin Fowler describes simultaneous optimism about AI's potential and direct
dislike of grating anthropomorphic interaction and confident fabrication. The
design implications above are synthesis, not claims of a particular product
mechanism.

## Related

- {% include wiki-related-link.md slug="llm-factual-recall" %}
- {% include wiki-related-link.md slug="reality-driven-ai-product-development" %}
