---
type: concept
title: 'Nunebot Maintenance Workflow'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: nunebot-maintenance-workflow
created: 2026-11-18
updated: 2026-11-18
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261110-tldr-dev:dev-017","url":"https://www.johnnunemaker.com/dont-make-a-human-do-what-ai-is-amazing-at/"}]
---

# Nunebot Maintenance Workflow

[John Nunemaker's article](https://www.johnnunemaker.com/dont-make-a-human-do-what-ai-is-amazing-at/)
describes using a reusable prompt to make small maintenance improvements
across repositories. Nunemaker starts a run from a coding-agent environment.
A private Git repository named brain stores priorities, feedback and existing
findings. It gives the next run continuity even when the coding session ends.

A run tends outstanding PRs, considers ranked priorities and production signals
such as errors and support tickets, then selects a small improvement. Separate
worktrees and runtime resources allow repository work to run in parallel.
An implementation goes through simplification, QA and bounded review, and the
PR carries evidence such as a regression test or before-and-after measurements.
Nunemaker keeps authority over merges, which generally trigger deployment for
his apps. His PR counts are a report of throughput for his own repositories.

## Discussion

The commute asked whether Nunebot was a Claude Code session or an independent
service. The published artifact is a prompt a coding agent executes, and the
article describes manually starting runs from T3 Code. Scheduling could
change how runs start without changing the split between the coordinator,
repository workers and the human who merges. The discussion singled out
small changes, persistent feedback and explicit handoff as the reusable
parts of the workflow.

The published [Nunebot orchestration prompt](../tools/nunebot-prompt.html)
has its own entry.

<!-- source-item-id: 20261110-tldr-dev:dev-017 -->
