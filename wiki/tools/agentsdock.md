---
type: tool
title: 'AgentsDock'
# prettier-ignore
aliases: ["AgentsServer"]
# prettier-ignore
tags: ["coding-agents","remote-development","mobile","self-hosting","codex","claude-code","cursor","tmux"]
wiki_slug: agentsdock
created: 2026-09-15
updated: 2026-09-15
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a09fa599d2a0b5a-07","url":"https://agentsdock.net/"},{"source_item_id":"url_agentsdock_client","url":"https://github.com/ZhengyiLuo/AgentsDock"},{"source_item_id":"url_agentsdock_server","url":"https://github.com/ZhengyiLuo/AgentsServer"}]
---

# AgentsDock

AgentsDock is an open-source desktop and mobile client for controlling coding
agents that run through a self-hosted AgentsServer on a computer the user
controls.

## Key Ideas

- The agent CLI and project files stay on the server machine; the phone or
  desktop app is a remote client, not the execution host.
- The client supports Codex, Claude Code, and Cursor, with persistent chats,
  file and media review, scheduled jobs, and tmux-backed terminal access.
- A user can connect several clients to one server or manage several servers,
  which fits a home-Mac / away-from-home workflow.
- Self-hosting does not make model inference local. The configured model
  provider still processes model requests, and clients may cache content.

## Architecture and Access Boundary

AgentsServer runs beside the repositories and authenticated agent CLIs. It
exposes an authenticated HTTP/WebSocket interface for chats, files, terminal
sessions, jobs, and process state. AgentsDock connects to that server from
macOS, Linux, Windows, iPhone, iPad, or Android.

The published setup guide recommends a private network such as Tailscale for
access away from the server's local network. That makes the product a remote
control plane over a machine the user already owns, not a hosted coding-agent
service. Provider subscriptions and server uptime remain separate operational
requirements.

## Practical Evaluation

For a home Mac that remains online while its owner is at work, AgentsDock can
start or resume supported agent chats, monitor long-running work, browse
artifacts, and open a real terminal from a phone. The dedicated mobile client
is the primary interface; it is not necessary to use the ordinary Codex or
Claude mobile client.

The project publishes client and server source under open-source licenses and
offers public release artifacts. The reviewed public pages do not establish a
paid hosted tier or product price, so cost should be treated as the user's
machine, network, and existing model-provider plan rather than quoted as a
confirmed zero-cost deployment. This is a future option, not an adoption
decision.

## Source Notes

### [AgentsDock](https://agentsdock.net/)

<!-- source-item-id: 1a09fa599d2a0b5a-07 -->

TLDR Dev, 2026-09-14. The product site describes the supported clients,
self-hosted server arrangement, remote workflow, and setup path.

### [AgentsDock client repository](https://github.com/ZhengyiLuo/AgentsDock)

<!-- source-item-id: url_agentsdock_client -->

The public repository documents desktop and mobile clients, supported agent
CLIs, persistent work features, and the Apache-2.0 licensing boundary for its
original code.

### [AgentsServer](https://github.com/ZhengyiLuo/AgentsServer)

<!-- source-item-id: url_agentsdock_server -->

The public backend repository documents the authenticated self-hosted process
that owns workspaces, agent CLIs, histories, files, jobs, and terminal sessions.

## Related

- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="codex-resets" %}
