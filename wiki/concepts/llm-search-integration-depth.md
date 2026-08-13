---
type: concept
title: 'LLM Integration Depth in Search'
# prettier-ignore
aliases: ["Three ways to integrate LLMs into search","DoorDash, Instacart, and Uber Eats LLM search architectures"]
# prettier-ignore
tags: ["search","llm-architecture","retrieval","query-understanding","production-systems"]
wiki_slug: llm-search-integration-depth
created: 2026-07-29
updated: 2026-07-29
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19fad8d9ff2bc642-15","url":"https://blog.bytebytego.com/p/why-doordash-instacart-and-uber-eats"}]
---

# LLM Integration Depth in Search

The right production-search architecture depends less on choosing a model than on deciding where LLM semantics should enter an existing stack: constrained query understanding, domain-adapted intent processing, or the retrieval representation itself.

## Key Ideas

- DoorDash constrains LLM query segmentation and entity linking to an existing knowledge-graph taxonomy while retaining classical hybrid retrieval.
- Instacart combines offline context engineering and caching for head queries with a fine-tuned real-time model for the long tail, while downstream retrieval remains conventional.
- Uber Eats uses a fine-tuned multilingual two-tower model as the embedding substrate for queries and documents, then applies retrieval optimizations for production scale.
- Existing assets and constraints determine useful integration depth: knowledge graphs, legacy query-understanding systems, and embedding infrastructure lead to different designs.
- Production decisions should be compared through constraints, evaluation, latency, cost, rollout, and operational ownership rather than by model brand.

## Three Integration Boundaries

| System    | LLM boundary                                                                                           | Existing asset it preserves                                | Production tradeoff                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| DoorDash  | Query segmentation and taxonomy-constrained entity linking                                             | Knowledge graphs plus keyword, graph, and hybrid retrieval | Keeps generation out of most retrieval decisions while using LLM semantics to improve structured intent                                         |
| Instacart | Domain-adapted query understanding, cached offline for head queries and fine-tuned online for the tail | Conventional downstream retrieval and ranking              | Consolidates specialized intent models while paying real-time model cost only where caching cannot help                                         |
| Uber Eats | Fine-tuned multilingual embeddings inside both towers                                                  | Two-tower approximate-nearest-neighbor retrieval           | Places LLM-derived representations on the retrieval path and therefore depends on compression, quantization, filtering, and indexing efficiency |

The comparison is not a maturity ladder. Deeper runtime integration is not
automatically better. Each design exploits a different installed base and
spends latency, cost, and operational complexity where that company expects the
largest relevance gain.

## Reusable Decision Frame

Before selecting a model, locate the semantic failure and the safest insertion
point:

1. If the catalog already has a trustworthy ontology, constrain the model to
   translate natural language into that vocabulary.
2. If many brittle intent models have accumulated, consolidate query
   understanding while keeping retrieval independently testable.
3. If multilingual or cross-vertical representation is the bottleneck, a
   domain-tuned embedding backbone may justify deeper integration.
4. In every case, evaluate hard constraints separately from soft relevance.
   Similarity alone is unsafe for requirements such as allergens, dietary
   restrictions, geography, or fulfillment type.
5. Measure the full production system: offline quality, online behavior,
   latency, compute and storage cost, fallback behavior, and rollout risk.

## Source Notes

### [Why DoorDash, Instacart, and Uber Eats Integrated LLMs Into Search Three Different Ways](https://blog.bytebytego.com/p/why-doordash-instacart-and-uber-eats)

<!-- source-item-id: 19fad8d9ff2bc642-15 -->

TLDR, 2026-07-29.

The ByteByteGo article is the comparison layer. The commute save explicitly
requested that its three underlying engineering sources remain first-class
references:

- [How DoorDash leverages LLMs for better search retrieval](https://careersatdoordash.com/blog/how-doordash-leverages-llms-for-better-search-retrieval/)
  describes taxonomy-constrained segmentation and entity linking, manual
  evaluation, hybrid retrieval, and production relevance results.
- [Building the Intent Engine](https://company.instacart.com/tech-innovation/building-the-intent-engine-how-instacart-is-revamping-query-understanding-with-llms)
  describes context engineering, post-processing guardrails, fine-tuning, the
  head-query cache, and the real-time long-tail model.
- [Scaling Multilingual Semantic Search in Uber Eats Delivery](https://arxiv.org/abs/2603.06586)
  reports the unified Qwen2 two-tower system, training data, loss functions,
  Matryoshka representations, and evaluation across six markets and three
  verticals.

## Related

- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
- {% include wiki-related-link.md slug="interface-design-rules" %}
- {% include wiki-related-link.md slug="architecture-must-earn-its-keep" %}
