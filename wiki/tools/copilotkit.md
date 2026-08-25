---
type: tool
title: 'CopilotKit'
# prettier-ignore
aliases: ["CopilotKit agent frontend stack"]
# prettier-ignore
tags: ["copilotkit","agent-ui","generative-ui","react","ag-ui","human-in-the-loop","agent-protocols"]
wiki_slug: copilotkit
created: 2026-08-24
updated: 2026-08-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"url_863345d6291867a4","url":"https://docs.copilotkit.ai/"}]
---

# CopilotKit

CopilotKit is a frontend stack for building agentic product experiences in React, including chat, generative UI, shared state, persistence, tool rendering, and human-in-the-loop interactions.

## Key Ideas

- Prebuilt, headless, and generative UI options let teams choose how much product surface the toolkit owns.
- AG-UI adapters separate the frontend experience from a specific model or backend agent framework.
- Frontend tools, shared state, and agent context let an agent interact with the application rather than remain inside an isolated chat box.
- Thread lifecycle, persistence, authentication, telemetry, and runtime deployment remain application architecture concerns even when UI components are prebuilt.
- The documentation lists integrations across multiple agent frameworks; compatibility breadth should still be verified against the exact features and versions a product needs.

This entry reflects the project's own documentation and product claims. It does not establish comparative reliability, accessibility, security, or performance against alternative agent UI stacks.

## Source Notes

### [CopilotKit documentation](https://docs.copilotkit.ai/)

<!-- source-item-id: url_863345d6291867a4 -->

Official documentation, accessed 2026-08-24. Covers UI primitives, AG-UI backends, tools, state, runtime, persistence, deployment, and supported framework integrations.

## Related

- {% include wiki-related-link.md slug="interface-design-rules" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
