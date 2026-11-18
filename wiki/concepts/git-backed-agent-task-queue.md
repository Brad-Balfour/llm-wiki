---
type: concept
title: 'Git-Backed Task Queues for Coding Agents'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: git-backed-agent-task-queue
created: 2026-11-17
updated: 2026-11-17
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261109-tldr:general-009","url":"https://sergeykuhne.com/blog/fighting-ai-brain-fry"}]
---

# Git-Backed Task Queues for Coding Agents

[Sergey Kuhne's essay](https://sergeykuhne.com/blog/fighting-ai-brain-fry)
describes an experiment in managing the sequencing and context switches that
come with parallel coding-agent sessions. Every ticket is a Markdown file
stored alongside the relevant code. The committed board preserves the state
of the work when a chat or terminal session ends.

1. An agent cycles through the board. It researches new tickets, implements
   tickets marked safe, runs tests and a browser check, and checks what is
   already deployed. Sensitive changes go on a branch for approval. Kuhne
   handles production deployment.
2. A script reads the board and prioritizes questions, reviews and tradeoffs
   that need a human decision in one owner inbox.
3. A Claude artifact regenerated from Git presents the board and a review
   page per ticket. The decision goes back onto the ticket in Git.
4. The owner loads one ticket, makes a decision or requests another action,
   and returns the ticket to the queue before opening the next.

## Discussion

The commute discussion emphasized parallel agent execution with one human
decision at a time. Recording the decision and returning the ticket to the
queue closes the context for the human while leaving the next action available
to the agent. A review view is useful when it makes the reason for a change
and the decision required easy to find. The author also identifies two ongoing
problems: preparing concise review context and stopping blocked tickets from
cycling indefinitely. The essay describes one person's experience and supplies
no reusable schema, full priority algorithm or measured productivity gain.

<!-- source-item-id: 20261109-tldr:general-009 -->
