---
type: concept
title: 'Production Incident Investigation Agents'
aliases: ['Stream production investigation agent']
tags: ['ai-agents', 'incident-response', 'observability', 'agent-security']
wiki_slug: production-incident-investigation-agents
created: 2026-11-03
updated: 2026-11-03
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261023-tldr-dev:dev-003","url":"https://getstream.io/blog/ai-agent-production-investigation/"}]
---

# Production Incident Investigation Agents

Stream describes an agent that investigates production questions when an engineer tags it in Slack or an alert fires. A lightweight Claude Haiku gate triages messages; Claude Opus performs deeper investigation using tools, and a fresh-context review checks the result. The article does not name the reviewer model or publish triage prompts, thresholds, false-positive rates, or costs. The agent is described in terms of responding to triggers; the article does not establish continuous independent polling of all telemetry.

The investigation can consult logs, metrics, database query results and source code. Findings should cite concrete evidence, and claims that cannot be verified should be identified as such. A separate review challenges conclusions and alternatives, but the author says repeated automatic review was limited by capacity. Stream describes 22 evaluation cases run manually through the real pipeline, including irrelevant chat, fabricated tool traps and prior mistakes. This is a practical regression set, not proof of general reliability.

The architecture constrains access outside the prompt: isolated tool sessions, read-only database access, credentials held by the host service rather than the sandbox, restricted networking and outbound filtering. The service controls side effects; engineers approve fixes, review draft pull requests and execute operational runbooks. One recreated Redis incident is a useful example, not an estimate of typical performance.

## Questions from the commute

The discussion asked whether a human must file a formal bug, how alerts and Slack messages start investigation, and how an agent authenticates to databases, observability tools and systems such as GitHub or Jira. It also asked who provisions and rotates non-human identities. The article does not specify a general identity-provisioning or credential-rotation design, generic integration authorization, or whether the tools use MCP. Avoid filling those gaps with assumptions.

The discussion also compared the inexpensive first-stage gate to a simple system-one classifier. That comparison is a useful interpretation; the publication does not disclose the actual routing criteria or calibration. The transferable design is to separate inexpensive triage, evidence gathering and independent checking while preserving human control of changes.

## Source

[We Built an AI Agent to Investigate Production Issues](https://getstream.io/blog/ai-agent-production-investigation/), Aditya Nugraha, October 22, 2026. Saved from October 23 TLDR Dev, item `dev-003`, with the surrounding commute discussion.

<!-- source-item-id: 20261023-tldr-dev:dev-003 -->

## Related

- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="agent-tool-boundaries" %}
