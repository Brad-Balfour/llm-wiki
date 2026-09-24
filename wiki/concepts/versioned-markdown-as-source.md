---
type: concept
title: 'Versioned Markdown as Source'
# prettier-ignore
aliases: ["Markdown in /src", "Source-adjacent specifications"]
# prettier-ignore
tags: ["software-design", "agentic-code", "specifications", "organizational-memory"]
wiki_slug: versioned-markdown-as-source
created: 2026-09-24
updated: 2026-09-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20260922-tldr-dev:dev-03","url":"https://htmx.org/essays/markdown-in-src"}]
---

# Versioned Markdown as Source

Carson Gross proposes keeping the durable intent behind generated code in
version-controlled Markdown near the implementation. The essay's `/src/md`
layout is a proposal, not an established standard. It aims to preserve
architectural, behavior, data, and API decisions that otherwise disappear with
an agent's prompt session. Code and tests can then be developed against that
record, while changes to implementation may need to be reflected back into it.

## Commute Discussion and Practical Fit

During the September 23–24 Dev commute, Brad asked what htmx is and how this
idea compares with Spec Kit and OpenSpec. htmx is an open-source library for
building interactive web interfaces with HTML attributes; it is also the site
where Gross published the essay. The comparison was a discussion synthesis:
spec-driven tools help teams formulate and execute a development process, while
Gross emphasizes preserving the resulting, current source-level intent beside
the code. A team could use both. The essay itself does not evaluate Spec Kit or
OpenSpec.

The useful adoption question is which decisions must survive the prompt
session. Keep stable behavior, constraints, and design reasons reviewable in
Git; let temporary exploration stay temporary. Maintain a link between those
documents, code, and tests so the written intent does not become stale.

## Source Notes

### [Markdown in /src](https://htmx.org/essays/markdown-in-src)

<!-- source-item-id: 20260922-tldr-dev:dev-03 -->

Carson Gross, htmx, 2026-09-21. Explicitly saved during the September 23–24
Dev commute with a request to retain the comparison and discussion.

## Related

- {% include wiki-related-link.md slug="agent-legible-codebases" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
