---
type: concept
title: 'Adaptive Context Engineering'
# prettier-ignore
aliases: ["Context engineering for capable models","The new rules of context engineering for Claude 5 generation models","Audit your Agent files"]
# prettier-ignore
tags: ["ai-agents","context-management","progressive-disclosure","skills","tool-design"]
wiki_slug: adaptive-context-engineering
created: 2026-07-28
updated: 2026-08-28
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19fa340bcb6a5879-13","url":"https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models"},{"source_item_id":"1a0480e09f24878f-05","url":"https://addyo.substack.com/p/audit-your-agent-files"}]
---

# Adaptive Context Engineering

Context engineering should evolve with model capability: remove inherited constraints that no longer improve measured outcomes, keep durable instructions focused on non-obvious context, and expose specialized guidance progressively through well-designed tools, skills, and references.

## Key Ideas

- System prompts, repository instructions, skills, memory, tools, and references form one context system whose layers can conflict or duplicate each other.
- Constraints that compensated for older model weaknesses should be reevaluated against current behavior instead of accumulating indefinitely.
- Expressive interfaces and typed tool parameters can communicate intended behavior more flexibly than narrow example-heavy instructions.
- Progressive disclosure keeps specialized procedures and tool definitions available without loading all of them into every request.
- Simplification should be evidence-driven because Anthropic's reported system-prompt reduction is specific to its models, product, and evaluations.

## Instruction Files Have a Half-Life

Agent configuration accumulates obsolete workarounds, duplicated policy, and
contradictory advice as models, tools, and repositories change. Addy Osmani's
audit method treats `AGENTS.md`, `CLAUDE.md`, memory, and skills as maintained
dependencies: identify what is actually loaded, remove instructions that no
longer earn their context cost, and test the resulting behavior rather than
assuming more prose is safer.

The distinction raised during the commute matters operationally. Claude Code's
in-session `/doctor` command can report configuration and environment health,
while the shell-level `claude doctor` is a separate diagnostic surface. Neither
performs the deeper semantic audit of whether every instruction is current,
non-conflicting, and useful. That review still requires repository knowledge
and observed task evidence.

## Source Notes

### [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)

<!-- source-item-id: 19fa340bcb6a5879-13 -->

TLDR, 2026-07-27.

### [Audit your Agent files](https://addyo.substack.com/p/audit-your-agent-files)

<!-- source-item-id: 1a0480e09f24878f-05 -->

Addy Osmani, 2026-08-27. Argues that agent instruction files acquire a
half-life and should be periodically tested, simplified, and reconciled rather
than allowed to grow monotonically.

## Related

- {% include wiki-related-link.md slug="agent-context-handoff" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
