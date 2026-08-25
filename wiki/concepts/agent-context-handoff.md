---
type: concept
title: 'Agent Context Handoff'
# prettier-ignore
aliases: ["Preserving an agent trajectory","A Field Guide to Fable: Finding Your Unknowns","Model Welfare for Agentic Engineers"]
# prettier-ignore
tags: ["ai-agents","context-management","model-routing","software-engineering"]
wiki_slug: agent-context-handoff
created: 2026-07-21
updated: 2026-08-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"url_4942c519be3d86ed","url":"https://stencil.so/blog/prewalk"},{"source_item_id":"url_7c4bbc509bc1334f","url":"https://x.com/trq212/status/2073100352921215386"},{"source_item_id":"url_2d8aa34e5e8fcc46","url":"https://yegge.ai/essays/model-welfare/"}]
---

# Agent Context Handoff

When work moves between models, preserving the useful working context can be
more valuable than handing off a prose plan. A compact plan alone may force the
next model to reread the code, reconstruct the constraints, and repeat expensive
exploration.

## Key Ideas

- A handoff should preserve verified decisions, task state, and the evidence
  behind them—not merely a summary of intended work.
- Switching models after a concrete, validated first action can give the next
  model an in-context example of the desired trajectory.
- Model routing is not automatically a cost optimization when both models must
  independently read the same large context.

## Discover Unknowns Before They Become Handoff Debt

Thariq Shihipar's field guide treats the prompt or plan as a map and the real
codebase, product, and constraints as the territory. A stronger model can move
faster in the wrong direction when the gap between them is invisible. Useful
handoff preparation therefore includes blind-spot searches, concrete
prototypes, implementation logs, and comprehension checks—not only a polished
task description.

The TLDR tracking link supplied for this source resolves to the X article. The
publicly indexed companion material supports the title and workflow themes, but
the X rendering is not a stable archival format; the provenance preserves the
canonical article URL.

## Preserve the Seat Without Assuming Sentience

Steve Yegge's model-welfare essay proposes persistent named “seats,” graceful
session handoffs, retained work history, recognition, bounded workdays, and
blameless failure handling. Those practices can improve continuity and
operability without accepting the essay's unsupported claim that current models
are sentient or feel distress.

The engineering value is in the external state and transition protocol: give a
new session a purpose, let the outgoing session leave a useful note, preserve an
audit trail, and treat a visible escalation as a valid outcome. Claims that
human-like treatment measurably improves model performance require independent
evaluation.

## Source Notes

### [You only need the frontier model for one single edit](https://stencil.so/blog/prewalk)

<!-- source-item-id: url_4942c519be3d86ed -->

Saved from TLDR Dev, 2026-07-21.

### [A Field Guide to Fable: Finding Your Unknowns](https://x.com/trq212/status/2073100352921215386)

<!-- source-item-id: url_7c4bbc509bc1334f -->

Thariq Shihipar, 2026. The supplied TLDR short link resolves to this X article
about finding unknowns before, during, and after agent-assisted implementation.

### [The Shape of Things to Come, Part 2: Model Welfare for Agentic Engineers](https://yegge.ai/essays/model-welfare/)

<!-- source-item-id: url_2d8aa34e5e8fcc46 -->

Steve Yegge, 2026-08. Combines practical continuity patterns with strong,
unsubstantiated claims about model feelings and personhood; this entry retains
the former without treating the latter as fact.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
