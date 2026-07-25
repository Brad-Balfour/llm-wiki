---
type: concept
title: 'Review-Driven Software Factories'
# prettier-ignore
aliases: ["Why Software Factories Fail","Human-in-the-loop software factories"]
# prettier-ignore
tags: ["ai-agents","software-design","planning","code-review","context-management"]
wiki_slug: review-driven-software-factories
created: 2026-07-25
updated: 2026-07-25
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"dev-20260724-01","source_path":"sources/tldr/2026-07-24-why-software-factories-fail.txt","url":"https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md"}]
---

# Review-Driven Software Factories

Reliable AI-assisted software development treats specifications, plans, and review decisions as durable source artifacts while using agents to accelerate bounded implementation work.

## Key Ideas

- Review leverage is highest upstream, before implementation multiplies an incorrect product or architecture decision.
- Plans and specifications preserve intent across context compaction and model handoffs.
- Subagents isolate noisy exploration, but human alignment and accountable review remain necessary.
- The source presents experience-driven practices rather than strongly validated universal rules.

## Operating Model

1. Review the product intent before agents turn it into architecture.
2. Review the architecture before implementation multiplies its assumptions.
3. Keep the accepted specification and plan as source artifacts that survive
   context-window changes.
4. Give implementation agents bounded tasks and compact only after durable
   decisions have been written down.
5. Review for mental alignment with the system's intent, supported by tests and
   targeted code inspection, instead of pretending exhaustive line-by-line
   reading is always possible.

Subagents are useful here as context-isolation boundaries: research, review, and
implementation can happen without filling the main decision context with every
intermediate detail. They do not make accountability or cross-boundary review
optional.

## Source Notes

### [Why Software Factories Fail](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md)

<!-- source-item-id: dev-20260724-01 -->

TLDR Dev, 2026-07-24.

This page preserves the article's practical model and the July 24 commute
discussion. The recommendations are experience-driven; they are useful design
hypotheses, not strong empirical evidence that this workflow is universally
optimal.

## Related

- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
