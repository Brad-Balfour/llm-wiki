---
type: concept
title: 'Organizational Second Brain'
# prettier-ignore
aliases: ["Institutional intelligence agent","Expert knowledge compiler","Structured organizational memory"]
# prettier-ignore
tags: ["ai-agents","knowledge-management","agent-memory","evaluation","governance","institutional-knowledge"]
wiki_slug: organizational-second-brain
created: 2026-09-03
updated: 2026-09-03
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a0677c0ff3e1cd3-08","url":"https://engineering.fb.com/2026/09/02/ml-applications/organizational-second-brain-ai-learns-from-experts/?utm_source=tldrai"}]
---

# Organizational Second Brain

An organizational second brain makes expert judgment explicit in structured,
versioned text, separates that knowledge from executable reasoning procedures,
and turns expert corrections into tested edits rather than ephemeral chat
feedback or model-weight updates.

## Key Ideas

- Raw documents are evidence, but institutional knowledge also includes how
  experts interpret evidence, apply boundaries, and resolve ambiguity.
- Declarative knowledge files should be separate from imperative reasoning
  recipes so failures can be attributed to missing knowledge or faulty method.
- Deterministic routing, gateways, and dependency metadata make retrieval and
  impact analysis auditable instead of relying only on embedding similarity.
- High-density, frequently used reasoning belongs in the curated knowledge
  base; sparse reference material can remain in search-backed retrieval.
- Expert feedback compounds only when it is diagnosed, compiled into a minimal
  change, replayed against the failure, regression-tested, and human-reviewed.

## Four Interlocking Layers

Meta describes a system with four dependent layers:

1. A structured knowledge system stores positions, vocabulary, routing indexes,
   gateways, and explicit dependency relationships.
2. Composable recipes encode the steps experts follow without embedding the
   domain facts themselves.
3. An evaluation framework runs targeted replay and broader regression tests.
4. A self-improvement loop diagnoses corrections and proposes reviewable edits.

This separation makes a failure question concrete: did the source material lack
the needed position, did the procedure apply existing knowledge incorrectly,
or is the case genuinely ambiguous? Conversational form alone cannot answer
that attribution question.

## Knowledge Density and Progressive Disclosure

The system keeps frequently reused interpretations and boundaries in a curated
file graph while leaving detailed or rarely relevant documents to lexical or
semantic retrieval. Recipes load only the knowledge needed for the current
phase. Meta reports that moving from a flat instruction file and broad search to
this staged structure reduced tokens per turn by roughly 80 percent in its
implementation; that is a system-specific result, not a universal guarantee.

## Corrections as a Compilation Pipeline

Each expert correction moves through diagnosis, minimal editing, validation,
and review. A targeted replay tests the original failure without telling the
agent it is under test, while regression cases protect other behavior. After a
fix lands, the triggering scenario becomes another test, so expert effort raises
the future quality floor.

The strongest reusable pattern is not autonomous self-editing. It is a
transparent promotion boundary: proposed knowledge and procedural changes are
version-controlled, independently checked, reversible, and kept subordinate to
expert authority.

## Source Notes

### [An Organizational Second Brain: Building an AI That Learns From Experts](https://engineering.fb.com/2026/09/02/ml-applications/organizational-second-brain-ai-learns-from-experts/?utm_source=tldrai)

<!-- source-item-id: 1a0677c0ff3e1cd3-08 -->

Shaurya Sengar, Jason Nawrocki, Jay Shah, and Prashant Kommireddi, Meta
Engineering, 2026-09-02. The authors describe a compliance-domain system using
structured files, composable recipes, checkpoints, escalation, targeted replay,
regression testing, independent review, and human approval. Reported efficiency
and quality outcomes are Meta's measurements from that implementation.

## Related

- {% include wiki-related-link.md slug="persistent-knowledge-for-skill-evolution" %}
- {% include wiki-related-link.md slug="governed-agent-memory" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="evidence-accumulating-problem-discovery" %}
