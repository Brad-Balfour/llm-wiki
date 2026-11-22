---
type: concept
title: 'Building Always-On Agents'
aliases: ['Event-driven agents']
tags: ['ai-agents', 'agent-harnesses', 'event-driven-architecture']
wiki_slug: building-always-on-agents
created: 2026-11-21
updated: 2026-11-21
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261116-tldr:general-006","url":"https://claude.com/resources/articles/building-always-on-agents"}]
---

# Building Always-On Agents

The November 16 TLDR reference describes William Hu's guide to agents that
retain context across sessions and act without constant supervision. The
November 21 discussion asked how the guide fits with Anthropic's Managed Agents
announcement and what a developer still needs to build. The article was also
saved for later full reading.
[William Hu's guide](https://claude.com/resources/articles/building-always-on-agents)

## The runtime and the application

The discussion treated Managed Agents as the execution platform and the guide as
a design for the application around it. An always-on agent can wait for a
webhook or timer, resume with the relevant state, investigate or act, save
progress, and go idle again. Continuous availability comes from keeping
triggers and state durable between runs.

| Primitive   | What the platform contributes                                | What the application owns                                                                                                |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Event inbox | A session and execution API that can receive dispatched work | Ingest external events, persist them, deduplicate delivery, retry safely, and coordinate workers                         |
| Timers      | Sessions that can be resumed when scheduled work arrives     | Store follow-up intent and ensure work runs at the right time, using a hosted scheduler where available or operating one |
| Memory      | Session history and persistent execution context             | Choose which preferences and work state survive, what can be retrieved, how to compact it, and when to delete it         |
| Permissions | Sandbox, tool, and credential boundaries                     | Decide which actions an agent can take for each user or workload and require approvals for consequential actions         |
| Outbox      | Session events, streams, and results                         | Persist outgoing messages, handle delivery retries and rate limits, and prevent duplicate notifications                  |

Deployment differences discussed included hosted scheduling, automated memory
curation, and outgoing webhooks. The recorded conversation did not establish
feature parity or exact availability. The architecture needs an owner for each
responsibility whichever deployment supplies the underlying feature.

## Example from the discussion

A deployment failure enters an inbox through a webhook. A worker deduplicates
the event, starts an investigation session with scoped access, and records which
release and service are involved. The agent checks logs in the sandbox and can
request approval before taking an operational action. A timer schedules a
recheck. The outbox delivers the findings, retrying delivery without repeating
the investigation.

Incoming event state, investigation and session state, and outgoing delivery
state have different retry and retention requirements. Keeping them explicit
lets a notification fail and recover independently from the work that produced
it.

## Related

- [Self-Hosted Claude Managed Agents](../tools/self-hosted-claude-managed-agents.md)
- [Long-Running Agent Harnesses](long-running-agent-harnesses.md)

<!-- source-item-id: 20261116-tldr:general-006 -->
