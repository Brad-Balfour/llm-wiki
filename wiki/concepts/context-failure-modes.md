---
type: concept
title: 'Context Failure Modes in Agent Systems'
# prettier-ignore
aliases: ["The State of Context Engineering"]
# prettier-ignore
tags: ["ai-agents","context-management","reliability"]
wiki_slug: context-failure-modes
created: 2026-11-04
updated: 2026-11-04
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261026-tldr:general-005","url":"https://www.dbreunig.com/2026/10/24/the-state-of-context-engineering.html"}]
---

# Context Failure Modes in Agent Systems

[Drew Breunig's talk](https://www.dbreunig.com/2026/10/24/the-state-of-context-engineering.html) argues that larger windows and stronger agents do not remove the need to select, structure, and maintain relevant information. The engineering problem is deciding what the model should infer and what the surrounding system should reliably manage.

## Four failures of accumulated context

- **Poisoning:** an error or hallucination enters the context and is repeatedly treated as fact. Breunig's example is a game-playing agent pursuing an item required in a different version of the game after the mistaken goal entered its plan. Poisoning is broader than malicious input.
- **Distraction:** a long history can draw the model toward patterns in that history instead of following an instruction or using its base knowledge. He cites an experiment in which contradictory examples increasingly displaced a translation instruction, and a game agent that repeated prior actions rather than making new plans.
- **Confusion:** irrelevant, even true, facts influence the response. For example, a personal memory from another context may affect an unrelated work question. The exact effect can be difficult to predict.
- **Clash:** instructions, tools, skills, or other context conflict with each other. A harness can present incompatible guidance even when each instruction seems reasonable in isolation.

These categories overlap but identify different debugging questions: is a fact wrong, is history dominating an instruction, is irrelevant information influencing an answer, or are directives in conflict?

## Persistence introduces further problems

Breunig calls resistance caused by a model's learned tool and workflow habits **fighting the weights**. He calls continued pursuit of a stale hypothesis or subtask **context inertia**. These are related to, but distinct from, the four long-context failures. The talk describes selectively supplying tools and information, isolating subtasks, pruning or summarizing history, and storing state outside the conversation. These techniques have tradeoffs: a reset can remove useful evidence, and model-selected pruning can itself be wrong. Treat specific thresholds as the author's operating heuristic, not a universal limit.

The commute discussion asked for a senior-engineering account of the failure categories before moving to mitigations, and for a distinction between deterministic infrastructure and probabilistic inference. A useful design question is which boundary can be enforced by code and which requires judgment; deterministic orchestration does not make a model-selected relevance decision deterministic in substance. See also [Adaptive Context Engineering](adaptive-context-engineering.md).

## Sources

<!-- source-item-id: 20261026-tldr:general-005 -->

- Drew Breunig, [The State of Context Engineering](https://www.dbreunig.com/2026/10/24/the-state-of-context-engineering.html), October 24, 2026.
