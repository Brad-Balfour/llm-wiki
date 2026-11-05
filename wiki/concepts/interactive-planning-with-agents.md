---
type: concept
title: 'Interactive Planning with Agents'
# prettier-ignore
aliases: ["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]
# prettier-ignore
tags: ["ai-agents","planning","human-oversight","software-engineering","interface-design"]
wiki_slug: interactive-planning-with-agents
created: 2026-11-04
updated: 2026-11-04
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261026-tldr:general-013","url":"https://maggieappleton.com/planning-agents"}]
---

# Interactive Planning with Agents

[Maggie Appleton](https://maggieappleton.com/planning-agents) argues that planning with agents should support human thought and decision-making, not merely produce instructions for an agent. Plans orient action but cannot anticipate every condition encountered during implementation; discoveries need to feed back into the plan.

## Boundary objects and thicker interfaces

Humans and agents have different views of a task. A boundary object is a shared artifact that supports coordination across groups with different needs. Agent-facing Markdown can be useful but expensive for a person to inspect. Appleton proposes richer translation through visual, interactive, and social representations that let people compare, manipulate, and discuss the decision at hand. The goal is to make evidence legible, not to add diagrams for their own sake.

Her examples include a live comparison of design-system shadows with controls for intensity and color, adjustable hover animation, a state-machine explorer for a video player, and Mindwalk's interactive trace of an agent's path through a codebase. Her experimental Chopin prototype combines shared planning with interactive visuals; it is presented as a proof of concept, not a finished solution.

## Compare working alternatives

For retry logic, Appleton had agents build three approaches on separate branches and create an interactive comparison. One covered all 60 call sites with eight judgment calls; another covered them but silently changed behavior at 16; a third looked smaller but left 46 unsupported. The comparison made compatibility and blast radius visible before the human chose. The commute discussion clarified that the central idea is **executable prototypes as decision evidence**: an interactive diagram is one possible presentation, not the defining feature. Parallel experiments have costs and must be isolated and assessed against the actual decision.

The discussion also highlighted two implications: implementation and planning form an ongoing loop, and human attention can become the scarce resource when agents generate more than a person can absorb. A useful interface spends computation on organizing evidence for judgment rather than simply producing more prose. See [Human Understanding in Agentic Coding](human-understanding-in-agentic-coding.md) and [AI-Mediated Engineering Judgment](ai-mediated-engineering-judgment.md).

## Sources

<!-- source-item-id: 20261026-tldr:general-013 -->

- Maggie Appleton, [Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces](https://maggieappleton.com/planning-agents).
