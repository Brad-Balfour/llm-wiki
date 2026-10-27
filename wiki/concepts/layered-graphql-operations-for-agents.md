---
type: concept
title: 'Layered GraphQL Operations for Agents'
aliases: ['From Use Case to GraphQL Operation']
tags: ['ai-agents', 'graphql', 'tool-use', 'retrieval', 'api-design']
wiki_slug: layered-graphql-operations-for-agents
created: 2026-10-27
updated: 2026-10-27
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261021-tldr-dev:dev-010","url":"https://magiroux.com/posts/from-use-case-to-graphql-operation"}]
---

# Layered GraphQL Operations for Agents

Marc-André Giroux proposes escalating from known operations to schema discovery
as an agent translates a use case into a GraphQL operation. The objective is to
reuse proven work where possible while retaining a path for unfamiliar needs.
This is a design proposal, not a measured production result.

## Escalate Only as Needed

1. Reuse a local script, skill, persisted operation, or other known operation
   when it already expresses the task.
2. Search previously written operations and adapt a suitable candidate. An
   operation index can retain successful operations with useful metadata so
   later work can find and review them.
3. Discover relevant schema types, fields, and root paths, then construct and
   validate a new operation when existing ones are insufficient.
4. If the schema cannot express the use case, propose a schema change for
   human consideration rather than pretending a query already exists.

An overly broad operation can sometimes be pruned; an operation missing required
fields may need schema discovery. Validation, linting, and human review remain
important when new operations are retained for future reuse.

## Search and Evidence Boundaries

The article discusses a searchable operation collection and schema discovery.
It raises hybrid keyword search such as BM25 and embeddings as a possibility;
it does not establish a deployed index or its performance. Ranking candidates,
compact representations, and choosing when to move between layers remain
design questions. The author calls for future benchmarking rather than reporting
hit rates or demonstrating a latency improvement.

The October 24 commute save asked for the author and publisher, the substance
beyond the newsletter, the example domain, the size and read/write mix of the
API, and how both indexes would work. The example involves a user profile and
recent posts; it does not inventory the API or quantify mutations versus reads.
The discussion's emphasis on reusable validated operations and a separate
schema index is a useful interpretation of the proposal, not evidence of a
specific implementation or benchmark.

## Source Notes

[From Use Case to GraphQL Operation: A Layered Approach for Agents](https://magiroux.com/posts/from-use-case-to-graphql-operation),
Marc-André Giroux, XuoriG's Blog, October 20, 2026. Saved from TLDR Dev,
October 21, item `dev-010`, position 10, with the accompanying commute discussion.

<!-- source-item-id: 20261021-tldr-dev:dev-010 -->

## Related

- {% include wiki-related-link.md slug="agent-tool-boundaries" %}
- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
