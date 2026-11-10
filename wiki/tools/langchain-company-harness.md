---
type: tool
title: 'LangChain Company Harness'
aliases: ['The five components of building a company harness']
tags: ['ai-agents', 'agent-harnesses', 'identity', 'sandboxing', 'memory']
wiki_slug: langchain-company-harness
created: 2026-11-09
updated: 2026-11-09
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261028-tldr-dev:dev-001","url":"https://www.langchain.com/blog/components-building-company-harness"}]
---

# LangChain Company Harness

LangChain describes shared infrastructure for agents serving multiple people
in a company. The authors explicitly identify five concerns: user experience,
identity and permissions, shared and individual memory, sandboxed code
execution, and scheduled or event-driven runs. These are infrastructure needs,
not a claim that all agents should perform the same work.

## Three Internal Agents

The examples are a go-to-market (GTM) agent for sales and marketing work,
OpenSWE for engineering tasks and pull-request review, and Content Studio for
company-oriented content. They have different jobs but use common
infrastructure. The company builds on open-source Deep Agents and its hosted
Managed Deep Agents offering.

## Experience and Identity

Employees invoke agents in Slack direct messages or channel mentions. A
breakout thread moves extended work out of the main channel conversation. For
bulk GTM email review, the team built a separate interface because Slack was
awkward for that workflow; the article does not explain that interface's
implementation.

Tool actions may use the requesting employee's identity or a fixed agent
identity. Requested OpenSWE code changes use the employee identity, while
automated PR reviews use a GitHub App. The GTM agent uses fixed Salesforce
credentials and employee-scoped email; email tools are available in Slack DMs
and disabled in shared channels. The article does not explain the policy's
rationale or enforcement. Content Studio uses employee identity for Notion and
fixed corporate credentials for Twitter, with a separate whitelist controlling
who may publish. Shared credentials alone do not grant every user every action.
The source does not specify OAuth flows, MCP credentials, or account
provisioning.

## Memory, Execution, and Triggers

The authors distinguish company-wide memory from individual memory and say
agents decide what to remember and where; they describe memory as the least
explored concern and do not specify a reconciliation algorithm. All three
agents can execute code in sandboxes, while the agent process runs outside the
sandbox. Base images differ, and OpenSWE can choose an image by user or channel.
A secret proxy allows authenticated calls without putting the original secret
in the sandbox.

A developer-configured event can trigger OpenSWE review when a GitHub PR is
created. Separately, a user can ask the GTM agent for a daily briefing and the
agent can create the recurring schedule. The article does not describe
automatic Slack-message triage, schedule revocation, or the underlying cron
API. Reliability, evaluation, audit, and supervision of long-lived agent
schedules remain useful questions from the discussion, not implementation
details established by the article.

## Source Notes

[The five components of building a company harness](https://www.langchain.com/blog/components-building-company-harness),
Harrison Chase and Caspar Broekhuizen, October 24, 2026. Saved from October 28
TLDR Dev, item `dev-001`, with the detailed commute discussion and corrections.
The user asked to focus on the article rather than extend the comparison to
Mastra. The source's omissions above distinguish unanswered questions from
its actual claims.

<!-- source-item-id: 20261028-tldr-dev:dev-001 -->

## Related

- {% include wiki-related-link.md slug="ramp-laminar" %}
- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
