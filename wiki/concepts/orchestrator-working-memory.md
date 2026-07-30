---
type: concept
title: 'Orchestrator Working Memory'
# prettier-ignore
aliases: ["The Orchestrator's Tax","Cognitive locality in multi-agent work"]
# prettier-ignore
tags: ["ai-agents","context-management","multi-agent-systems","delegation","workflow-design"]
wiki_slug: orchestrator-working-memory
created: 2026-07-29
updated: 2026-07-29
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19fad8d9ff2bc642-08","source_path":"sources/tldr/2026-07-29-orchestrator-working-memory.txt","url":"https://martinfowler.com/articles/orchestrator-tax.html"}]
---

# Orchestrator Working Memory

Subagents are most valuable when they protect the orchestrator's accumulated working memory: disposable exploration stays isolated, while only decision-relevant results return to the main context.

## Key Ideas

- Context pollution differs from one-time token spend because imported noise competes for attention throughout every later turn.
- Delegate by cognitive locality: work that requires the same mental model often belongs together even when it contains several nominal tasks.
- Worker exploration, repeated reads, failed approaches, and raw transcripts should remain disposable; the orchestrator should receive concise, decision-relevant results.
- Narrow delegation contracts should define inputs, permissions, ownership, and returned evidence without prescribing every implementation detail.
- The source establishes architectural principles and open questions, not a framework or a settled rule for permanent specialists versus dynamically created task agents.

## Design the Return Path

Delegation protects the main context only when the return path is narrower than
the work that produced it. A status check that imports a worker's raw transcript
defeats the isolation boundary: intermediate exploration becomes permanent
orchestrator baggage, and every later decision must compete with it.

A useful delegation contract therefore names:

- the question or outcome the worker owns;
- the context, tools, and permissions it needs;
- any file or state ownership that must not overlap with sibling workers; and
- the concise result, evidence, or decision that should come back.

This is information hiding applied to agent work. The orchestrator needs enough
evidence to act and verify, but not every search, failed approach, or tool log
that led to the result.

## Persistent Specialists or Task-Specific Agents?

The source does not choose between permanent specialist definitions and agents
created for one decomposition. The commute discussion separated the two:

- A persistent specialist fits an enduring capability such as code search,
  documentation lookup, planning, testing, or database analysis. Its interface
  and permissions can be reviewed and reused.
- A task-specific agent fits a decomposition that exists only for the current
  request. Its temporary instructions can be derived from the specification or
  task breakdown, and its working context can be discarded afterward.

Either lifecycle can pay the orchestrator tax if it returns raw work instead of
a distilled result. Conversely, either can protect working memory when tasks
are grouped by cognitive locality and their return contracts are explicit.

## Source Notes

### [The Orchestrator's Tax](https://martinfowler.com/articles/orchestrator-tax.html)

<!-- source-item-id: 19fad8d9ff2bc642-08 -->

TLDR, 2026-07-29.

Rahul Garg's article derives its argument from one multi-agent coding incident.
It distinguishes duplicated orientation, unsafe shared-repository operations,
and transcript pollution, then proposes compact working rules. It explicitly
labels its cost ranking and agent-count thresholds as provisional rather than
universal measurements.

The persistent-versus-dynamic comparison above came from the commute
discussion. The source raises architectural questions about delegation and
working memory but does not define an agent API or lifecycle framework.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
