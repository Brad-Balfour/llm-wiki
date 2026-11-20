---
type: concept
title: 'A2UI Component Trust Boundary'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: a2ui-component-trust-boundary
created: 2026-11-19
updated: 2026-11-19
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261112-tldr-ai:ai-010","url":"https://developers.googleblog.com/a2ui-10-build-delightful-fast-reliable-agentic-experiences/"}]
---

# A2UI Component Trust Boundary

Google's A2UI 1.0 announcement describes a stable protocol for agents to
send interactive UI descriptions to host renderers. The host provides a
catalog of registered components. The agent can select, configure, and
compose those components. Version 1.0 adds bidirectional function calls,
accessibility support, and protocol extension points.

## Commute discussion

The host can register custom components whose implementations use ordinary
JavaScript, animations, and host-permitted network calls. The catalog limits
what the agent can express. Registered code runs under the permissions of
its hosting environment. Browser origin rules, content security policies,
and an MCP App iframe's sandbox are separate controls.

Treat parameters and URLs from the agent as untrusted inputs. Validate them
at the host boundary and apply authorization when user-triggered functions
invoke sensitive actions. A host can render a constrained UI description
and still expose a powerful operation through a registered component.

## Source

- [Google Developers Blog, A2UI 1.0](https://developers.googleblog.com/a2ui-10-build-delightful-fast-reliable-agentic-experiences/)
