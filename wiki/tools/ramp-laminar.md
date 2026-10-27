---
type: tool
title: 'Ramp Laminar'
aliases: ['Building Laminar']
tags: ['ai-agents', 'agent-harnesses', 'durable-execution', 'temporal', 'ramp']
wiki_slug: ramp-laminar
created: 2026-10-27
updated: 2026-10-27
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261021-tldr-ai:ai-008","url":"https://builders.ramp.com/post/building-laminar"}]
---

# Ramp Laminar

Laminar is Ramp's in-house agent harness, used by products including Glass,
Ask Ramp, Bill Pay, Inspect, and Stack. Glass is a product built on the harness,
not the name of the underlying platform. Ramp's article does not describe
Laminar as a separately sold product.

## Why Ramp Built It

Sam Kronick describes three reasons: retain model and provider choice; keep a
fast feedback loop between the platform and product teams; and own the traces
and observability needed to debug agent behavior. Ramp had tried provider SDKs,
managed APIs, agent frameworks, vendors, and internal frameworks. Its account
is a company report, not a comparative benchmark of those alternatives.

The article reports that a small experienced team guided coding agents and
reviewed their work; the first version took six weeks and its code was generated
by agents. It does not give a precise team headcount. Engineers still own
architecture, review, on-call work, and the platform's health.

## State, Workers, and Sandboxes

The described stack uses Postgres, Temporal, and S3 for persistence and
workflow execution. The harness handles conversation history, compaction,
tools, streaming, human input, subagents, and observability. Agent definitions,
history, and turn-level state are stored independently of a sandbox. A session
can invoke a sandbox as a tool when it needs a computer; the session does not
depend on that sandbox staying alive.

Ramp describes nonblocking interactions, including queued messages and
steering, human approvals, and asynchronous subagents. Its cloud workers are
disposable "cattle": replaceability does not establish that workers are
prewarmed. Ramp's [sandbox deep dive](https://builders.ramp.com/post/building-laminar/sandbox)
discusses both on-demand and eagerly provisioned sandboxes; that is a separate
capacity choice from the worker fleet.

The commute discussion described an illustrative client and streaming layer,
API, session store, durable orchestration, task queues, workers, model gateway,
providers, and optional sandbox. These details are discussion context, not all
independently verified from the article's interactive diagram, whose steps were
not readable during intake. They should not be treated as a complete verified
deployment diagram.

## Comparisons and Questions from the Commute

The save requested the detailed questions and answers, including whether
Laminar is part of Glass, commercially available, how it compares with Mastra,
OpenClaw, Temporal, and Airflow, and whether a small team built v1. The article
supports Glass running on Laminar and the six-week account; it does not give an
exact headcount or establish a detailed feature comparison with every named
alternative.

[Temporal](https://docs.temporal.io/temporal) is a general durable-execution
platform whose workflow history supports recovery after failures. Mastra has a
workflow API, and its [Temporal integration](https://mastra.ai/blog/introducing-temporal-workflows)
maps Mastra workflows and steps to Temporal workflows and activities. Thus an
agent framework and a durable runtime can be composed; the article does not
claim Laminar uses Mastra. Airflow, Temporal, Mastra, and OpenClaw have different
purposes, so the conversation's comparisons are questions for a specific
workload, not proof of interchangeability.

The user also challenged claims that the article had been retrieved without
evidence and supplied its text in the conversation. For this intake the
supplied URL returned only a generic page through the web reader; the main
prose was available in a search result for Ramp's official
[alternate article URL](https://engineering.ramp.com/post/building-laminar).
The interactive diagram was not available in that rendering. Distinguishing
directly supported claims from discussion and unavailable details is part of
the saved lesson.

## Source Notes

[Building Laminar: Ramp's Managed Agents Platform](https://builders.ramp.com/post/building-laminar),
Sam Kronick, October 20, 2026. Saved from TLDR AI, October 21, item `ai-008`,
with the October 25 commute's detailed discussion and verification questions.

<!-- source-item-id: 20261021-tldr-ai:ai-008 -->

## Related

- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
