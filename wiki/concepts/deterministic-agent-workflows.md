---
type: concept
title: 'Deterministic Agent Workflows'
# prettier-ignore
aliases: ["Reducing Agent Token Spend"]
# prettier-ignore
tags: ["ai-agents","deterministic-tools","token-efficiency","workflow-design"]
wiki_slug: deterministic-agent-workflows
created: 2026-07-21
updated: 2026-07-29
confidence: medium
---

# Deterministic Agent Workflows

An agent workflow can reserve model reasoning for ambiguous judgment while
moving repeatable coordination, validation, and state handling into deterministic
tools. This reduces repeated context reconstruction and makes intermediate state
more inspectable.

## Key Ideas

- Token cost is often dominated by repeatedly reading and rebuilding context,
  not by the final edit or answer.
- Typed intermediate results and deterministic checks let agents reuse prior
  work instead of asking another model to rediscover it.
- The right boundary is task-specific: deterministic code should handle stable
  mechanics, while models remain responsible for judgment and synthesis.

## Source Notes

### [A Practical Guide to Reducing Token Spend](https://www.adamhjk.com/blog/a-practical-guide-to-reducing-token-spend/)

Saved from TLDR Dev, 2026-07-20.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
