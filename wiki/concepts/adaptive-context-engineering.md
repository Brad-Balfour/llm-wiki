---
type: concept
title: 'Adaptive Context Engineering'
# prettier-ignore
aliases: ["Context engineering for capable models","The new rules of context engineering for Claude 5 generation models","Audit your Agent files","What We Can Learn from Claude's Fable 5.1 System Prompt"]
# prettier-ignore
tags: ["ai-agents","context-management","progressive-disclosure","skills","tool-design"]
wiki_slug: adaptive-context-engineering
created: 2026-07-28
updated: 2026-09-10
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19fa340bcb6a5879-13","url":"https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models"},{"source_item_id":"1a0480e09f24878f-05","url":"https://addyo.substack.com/p/audit-your-agent-files"},{"source_item_id":"1a080bcb33cc0f31-14","url":"https://www.dbreunig.com/2026/09/09/what-we-can-learn-from-claudes-fable-5-1-system-prompt.html"}]
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

## Prompts Are Versioned Model Dependencies

Comparing Claude's Fable 5.0 and 5.1 system prompts shows that prompt rules can
serve several roles at once: product policy, feature wiring, safety boundary,
and targeted hotfix for a model-specific behavior. Those roles move at
different speeds, so a prompt that was necessary for one model generation may
be redundant, ineffective, or counterproductive for the next.

Model upgrades should therefore trigger regression evaluation of the whole
context system, followed by measured simplification. The goal is not a
universally shorter prompt; it is to remove rules that no longer earn their
cost while retaining product decisions and high-risk constraints. The commute
discussion translated this into an operational rule: treat prompts like
versioned dependencies, retest them when the underlying model changes, and
keep evidence for both additions and removals.

## Source Notes

### [What We Can Learn from Claude's Fable 5.1 System Prompt](https://www.dbreunig.com/2026/09/09/what-we-can-learn-from-claudes-fable-5-1-system-prompt.html)

<!-- source-item-id: 1a080bcb33cc0f31-14 -->

David Breunig, 2026-09-09. A comparison of successive Claude system prompts
that treats prompt rules as evidence of changing model behavior and product
decisions, while cautioning against assuming every old workaround remains
necessary.

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
