---
type: tool
title: 'Self-Hosted Claude Managed Agents'
aliases: ['Claude Managed Agents']
tags: ['ai-agents', 'agent-harnesses', 'enterprise-security', 'workload-identity']
wiki_slug: self-hosted-claude-managed-agents
created: 2026-11-21
updated: 2026-11-21
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261113-tldr-ai:ai-002","url":"https://claude.com/resources/articles/self-hosted-claude-managed-agents"}]
---

# Self-Hosted Claude Managed Agents

The November 13 TLDR AI reference describes Anthropic's private beta for running
the Managed Agents service, sandboxes, credential handling, and session history
in infrastructure the customer operates. The November 21 discussion followed
the announcement paragraph by paragraph, then examined what the platform
controls, where data flows, and how an agent can authenticate to an MCP gateway.
[Anthropic announcement](https://claude.com/resources/articles/self-hosted-claude-managed-agents)

## Which Claude agent product?

The discussion distinguished Managed Agents, a developer platform for defining
agents and running sessions, from Claude Code's coding harness, the Claude
Agent SDK, and the personal-assistant product referred to in the discussion as
Duet. A Managed Agents definition configures a model, instructions, tools,
MCP servers, and skills. A session is a running instance with its own history.
Similar harness responsibilities across products leave their underlying
implementations an open question.

Mastra was the comparison point. Its TypeScript framework gives developers
explicit control over typed workflows, branching, parallel steps, approvals,
model selection, runtime, and storage. It also offers a hosted platform and
observability. Managed Agents packages a Claude-oriented harness, execution
sandboxes, credential handling, session storage, and deployment APIs. An Agent
SDK integration in Mastra concerns the SDK layer. The Managed Agents service
has its own deployment and session model.

In the failed-CI example, a Managed Agents session receives an investigation
goal and scoped tools. A Mastra workflow can spell out the steps for fetching
failure data, delegating diagnosis, testing a candidate fix, requesting approval,
and opening a pull request. The comparison turns on how much process belongs in
explicit application code and how much should be delegated to a managed
runtime. Deployment boundaries and permission design determine security in
either approach.

## What moves behind the security perimeter?

The announcement walkthrough distinguished three deployments. In the hosted
version, Anthropic operates the agent service and sandboxes. With a
customer-hosted sandbox, the customer runs the workers while Anthropic runs the
harness. In the fully self-hosted beta, the customer operates the agent server,
persistent database, and execution workers. The same core APIs can ease
migration, while operations, upgrades, backup, network policy, and retention
become customer responsibilities.

Claude inference still uses the selected model endpoint. The discussion
considered Anthropic's API, cloud-provider endpoints, and an organization's own
gateway as routing choices. Model request handling depends on the endpoint and
its terms. Eligible zero-data-retention arrangements for inference are separate
from customer-side session storage, logs, and data sent to external tools.

Unattended build repair, release testing, alert triage, and backlog work were
examples of why these boundaries matter. Such tasks may require access to
internal code and services for hours at a time. The conversation described a
Docker Compose development setup with an agent server, PostgreSQL, and workers,
and Kubernetes with Helm for production. Private-beta access and deployment
materials were handled through Anthropic's account team at the time of the
discussion.

## Four controls for unattended execution

1. **Separate coordination from execution.** The harness coordinates model
   calls and the tool loop. Ephemeral workers run commands and tools. Durable
   history and the vault live outside the worker. Losing a worker can leave the
   session recoverable while an in-flight side effect still requires reconciliation.
2. **Keep reusable credentials outside the worker.** For supported API and MCP
   calls, a trusted proxy can attach credentials. A worker could request a
   permitted GitHub pull request without holding the reusable GitHub token.
   Service scopes and application rules still govern what a permitted call can do.
3. **Enforce network policy outside the model.** An environment could restrict a
   build agent to its git host and package registry. Customer-hosted workers
   need equivalent network enforcement. Destination allowlists leave the actions
   available at those destinations to service policy.
4. **Preserve an activity record.** Event histories can capture tool calls and
   results so an operator can reconstruct a change to a configuration file.
   OpenTelemetry traces can connect activity to application events and
   deployments. Event history and exported telemetry have separate access,
   retention, and redaction needs. Mastra also has tracing, so compare the
   data each integration actually records.

## Agent identity at an MCP gateway

The discussion followed up on non-human identity, a topic beyond the
announcement. Anthropic's identity documentation was cited for short-lived,
signed tokens that let an MCP gateway identify the calling agent using an
`agent_id`. The gateway validates the token's signature, issuer, audience,
expiry, and type, then applies its own authorization policy. Build, security,
and deployment agents can therefore receive distinct permissions even when they
reach the same gateway.
[Agent identity documentation](https://platform.claude.com/docs/en/managed-agents/self-hosted/agent-identity)

The discussion recorded a five-minute default and a configurable maximum of
fifteen minutes. Token expiry bounds the lifetime of already-issued credentials
when new issuance is revoked. Human creator attribution can depend on SSO and
the context in which the token is minted. When required by policy, a gateway
needs to check that the claim is present and separately require approval for
actions that need it. Agent authentication, credential injection, per-action
authorization, and enterprise identity lifecycle governance address different
problems.

## Related

- [Building Always-On Agents](../concepts/building-always-on-agents.md)
- [Long-Running Agent Harnesses](../concepts/long-running-agent-harnesses.md)

<!-- source-item-id: 20261113-tldr-ai:ai-002 -->
