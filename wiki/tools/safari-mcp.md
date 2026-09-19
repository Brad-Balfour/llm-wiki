---
type: tool
title: 'Safari MCP'
# prettier-ignore
aliases: ['Safari MCP server']
# prettier-ignore
tags: ['coding-agents', 'browser-automation', 'developer-tools', 'safari']
wiki_slug: safari-mcp
created: 2026-09-18
updated: 2026-09-18
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"1a0b45cd9ca86d4b-06","url":"https://webkit.org/blog/18325/webkit-features-for-safari-27-0/"}]
---

# Safari MCP

Safari MCP is a local Safari 27.0 server that lets coding agents inspect and
operate a Safari window through structured browser and developer-tool data.
WebKit documents support for Codex, Claude Code, and other MCP-compatible
agents.

## What It Exposes

- DOM state and rendered page inspection
- Network requests and navigation timing
- Screenshots and console output
- Form-state, layout, accessibility, and cross-browser checks

The server runs on the developer's machine and does not make network calls of
its own. Captured browser data is sent directly to the agent being used.

## Why It Matters

Safari MCP reduces the need to alternate between a browser, screenshots, and
typed explanations of what went wrong. That makes it useful for tasks where
the agent needs to inspect live rendering or browser state repeatedly. It is
not a replacement for ordinary web retrieval: public source research is still
usually simpler through direct HTTP or web search, while Safari MCP is most
valuable for interacting with a live local browser session.

## Setup

Safari 27.0 requires remote automation and external agents to be enabled in
Safari's Developer settings. The documented Codex registration is:

```text
codex mcp add safari-mcp -- /usr/bin/safaridriver --mcp
```

## Source Notes

### [WebKit Features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)

<!-- source-item-id: 1a0b45cd9ca86d4b-06 -->

WebKit, 2026-09-17. Describes Safari MCP's supported surfaces, local execution
model, setup, and example agent integrations.
