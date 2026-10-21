---
type: concept
title: 'Explicit Nonrequirements in Agent-Assisted Design'
aliases: ["What Requirements Don't You Have?"]
tags: ['software-design', 'ai-agents', 'specifications', 'complexity']
wiki_slug: explicit-nonrequirements
created: 2026-10-20
updated: 2026-10-20
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261019-tldr-dev:dev-009","url":"https://www.seangoedecke.com/what-requirements-dont-you-have/"}]
---

# Explicit Nonrequirements in Agent-Assisted Design

[Sean Goedecke's October 19 essay](https://www.seangoedecke.com/what-requirements-dont-you-have/)
argues that deliberately absent requirements enable simpler architectures.
The canonical newsletter reference had an unsuccessful author lookup; reading
the original site during intake independently establishes the attribution.

## What the Article Supports

The examples are specific compromises: Unicorn forgoes shared mutable state and
slow-client handling; S3 forgoes atomic multi-key updates; StatsD normally uses
UDP without guaranteed delivery; edge caches tolerate stale data; SQLite limits
concurrent writes; Cursor tolerates high tail latency. These illustrate design
choices, not permission to copy a trade-off into every application.

Choosing a compromise requires both technical understanding and business
judgment. Engineer–product-manager distrust can prevent concessions: neither
side trusts the other to judge which guarantees are necessary. Unified decisions
can help small teams make coherent choices.

The article also directly discusses coding agents inventing requirements:
mutexes, redundant state checks, immediate authorization changes and consistency
between caches can introduce coordination that the application never needed.
Explicit permission for tolerable staleness or inconsistency helps make the
intended design visible. Review the necessity of coordination as well as whether
its implementation works.

## October 20 Discussion: Apply This to Specifications

Brad asked how the article relates to spec-driven development, requested a
comparison against the original, and explicitly saved the entire substantive
back-and-forth, including the small qualifications. He confirmed seeing agents
add unnecessary requirements in practice. That is a personal observation, not
measured prevalence or a benchmark.

The commute proposed making a specification's negative space explicit:
acceptable compromises, guarantees deliberately not required and constraints
that must remain intact. A nonrequirement is more precise than an instruction to
keep things simple: it names exactly which promise the system does not make.

The discussion's concrete illustration was a dashboard balance allowed to lag
by up to 60 seconds while actual financial transactions retain stronger
integrity. The 60-second threshold is a discussion example, not Goedecke's
prescription. Freshness in a read model and correctness in a transaction path
need separate decisions.

A second proposed guard is to have an agent surface a new guarantee, mutex,
defensive check or cross-cutting abstraction as a design proposal before making
it a permanent architectural obligation. Human review decides whether the
benefit warrants the complexity. This is a commute extension of the essay,
not a quoted rule from the author.

The follow-up discussion named S3, StatsD and SQLite and raised organizational
trust; those points were initially assistant-reported and were checked against
the original during intake. The distinction matters because the same session
contained an invented suffix falsely labeled prepared context. A plausible
summary is not evidence that the article was read.

Declaring a nonrequirement must not silently weaken security, financial
integrity or necessary correctness. Decide acceptable compromises with domain
knowledge and human judgment. Tests establish behavior; they do not establish
that every implemented guarantee was requested.

## Related

- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="human-understanding-in-agentic-coding" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}

<!-- source-item-id: 20261019-tldr-dev:dev-009 -->
