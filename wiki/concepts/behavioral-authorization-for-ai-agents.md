---
type: concept
title: 'Behavioral Authorization for AI Agents'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: behavioral-authorization-for-ai-agents
created: 2026-11-17
updated: 2026-11-17
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261109-tldr-dev:dev-002","url":"https://www.uber.com/gb/en/blog/securing-ai-agents/"}]
---

# Behavioral Authorization for AI Agents

[Sean Tout, Max Zhurovich and Adi Raghavendra at Uber Engineering](https://www.uber.com/gb/en/blog/securing-ai-agents/)
describe security controls at agent provisioning, runtime and continuous
assurance. The registry captures agent ownership and intended scope. Argus
inspects code, prompts, dependencies, configuration and tool paths to propose
personas and intents for teams to review. At runtime, AI Guard evaluates
sensitive actions against the agent's scope, the user request and prior
context. Prompt provenance and evidence chaining connect the action to inputs
that legitimately authorized it. Replay, shadow evaluation and observability
help teams evaluate false blocks before enforcement.

## Discussion

The newsletter summary prompted a request for concrete engineering detail.
Ordinary access control answers whether the principal can invoke a tool.
Behavioral authorization checks whether that invocation serves the task. The
discussion used an illustrative document-reading and email agent to show why
that distinction matters when an untrusted document asks the agent to email
information. This was a hypothetical example.

The discussion distinguished an immediate human request, persistent human
instructions for long-running work, and an unattended production event that
starts an agent without a fresh user request. In the last case a standing
operational goal could supply intent, but a design still needs to specify who
granted the authority, what limits apply and what identity acts. Registry
metadata, workload identity, end-user identity and behavioral policy answer
different questions. The article gives concrete policy controls and recognizes
autonomous workflows, while leaving open service-principal provisioning,
credential rotation, delegation, impersonation and identity propagation
between agents. It gives no worked identity design for the event-triggered
case discussed during the commute. The [AgentCore identity investigation](https://github.com/Brad-Balfour/llm-wiki/issues/213)
tracks a related implementation question.

<!-- source-item-id: 20261109-tldr-dev:dev-002 -->
