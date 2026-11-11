---
type: tool
title: 'Slack Code API'
aliases: []
tags: ['ai-agents', 'collaboration', 'developer-tools', 'code-review']
wiki_slug: slack-code-api
created: 2026-11-10
updated: 2026-11-10
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261029-tldr:general-005","url":"https://slack.com/blog/developers/slack-code-api"}]
---

# Slack Code API

Slack's Code API gives custom coding agents a shared channel where engineers
can inspect and steer work. It is a collaboration interface for agents, not a
new coding model. Slack says the API is generally available on all Slack plans.

Agents can create code channels, add people and context, post progress and
artifacts, and archive a channel when work is done. The interface can show code
diffs, HTML previews, and agent reasoning steps. Slack describes channel
permissions, administrator controls, workspace data boundaries, message
compliance, and human approval for consequential changes as part of the design.

Slack describes GitHub review requests, two-way comment synchronization, and
merge prompts after approvals and tests as **coming soon**. Its overnight
incident example illustrates a possible workflow; it does not measure a
deployment's results. In the commute discussion, the useful distinction was
between shared visibility into an agent's work and the separate coding agent
that performs it.

## Source Notes

[Introducing the Slack Code API](https://slack.com/blog/developers/slack-code-api),
Rebecca Walker, October 28, 2026. Saved from October 29 TLDR General, item
`general-005`, with questions about permissions, integration and planned
pull-request features.

<!-- source-item-id: 20261029-tldr:general-005 -->

## Related

- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="entire-git-forge" %}
