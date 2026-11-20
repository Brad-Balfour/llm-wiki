---
type: concept
title: 'Agentic Engineering Maturity'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: agentic-engineering-maturity
created: 2026-11-19
updated: 2026-11-19
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261112-tldr:general-010","url":"https://zachwills.net/levels-of-agentic-engineering/"}]
---

# Agentic Engineering Maturity

Zach Wills describes seven stages of removing manual steps from software
delivery. The progression starts with giving an agent a complete ticket,
making repository guidance discoverable, and requiring evidence of working
behavior. Later stages move execution to shared infrastructure, close the
loop after deployment, coordinate multiple contributors, and help identify
the next work item.

Wills proposes shipping both a greenfield prototype and a real backlog item
in the existing product. The gap exposes constraints in environments, CI,
deployment, review, and policy that a prototype can bypass. The article
describes experience from two organizations and supplies no controlled
throughput, quality, or cost comparison.

## Commute discussion

The discussion treated the stages as a diagnostic for organizational
bottlenecks. Earlier factory accounts by Dan Shapiro, StrongDM, OpenAI,
Addy Osmani, and Uber informed that assessment. StrongDM's simulated services
were discussed as a concrete way to verify behavior against dependencies.
CI can also give an agent a repair task, such as adding a missing test or
producing review evidence. Independently exercised behavior gives reviewers
a stronger basis for trust than evidence produced solely by the implementing
agent. After deployment, failed outcomes can become backlog items when there
is a measurable success condition. Defining that condition for a business
outcome remains an open problem.

## Sources and related entries

- [Zach Wills, The levels of agentic engineering](https://zachwills.net/levels-of-agentic-engineering/)
- [Review-Driven Software Factories](review-driven-software-factories.md)
- [Eval-Driven Development for Agents](eval-driven-development-for-agents.md)
