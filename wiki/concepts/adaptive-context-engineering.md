---
type: concept
title: 'Adaptive Context Engineering'
# prettier-ignore
aliases: ["Context engineering for capable models","The new rules of context engineering for Claude 5 generation models"]
# prettier-ignore
tags: ["ai-agents","context-management","progressive-disclosure","skills","tool-design"]
wiki_slug: adaptive-context-engineering
created: 2026-07-28
updated: 2026-07-29
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19fa340bcb6a5879-13","source_path":"sources/tldr/2026-07-27-adaptive-context-engineering.txt","url":"https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models"}]
---

# Adaptive Context Engineering

Context engineering should evolve with model capability: remove inherited constraints that no longer improve measured outcomes, keep durable instructions focused on non-obvious context, and expose specialized guidance progressively through well-designed tools, skills, and references.

## Key Ideas

- System prompts, repository instructions, skills, memory, tools, and references form one context system whose layers can conflict or duplicate each other.
- Constraints that compensated for older model weaknesses should be reevaluated against current behavior instead of accumulating indefinitely.
- Expressive interfaces and typed tool parameters can communicate intended behavior more flexibly than narrow example-heavy instructions.
- Progressive disclosure keeps specialized procedures and tool definitions available without loading all of them into every request.
- Simplification should be evidence-driven because Anthropic's reported system-prompt reduction is specific to its models, product, and evaluations.

## Source Notes

### [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)

<!-- source-item-id: 19fa340bcb6a5879-13 -->

TLDR, 2026-07-27.

## Related

- {% include wiki-related-link.md slug="agent-context-handoff" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
