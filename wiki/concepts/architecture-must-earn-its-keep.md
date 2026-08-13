---
type: concept
title: 'Architecture Must Earn Its Keep'
# prettier-ignore
aliases: ["Architecture should keep earning its keep","Remove architecture after its original constraint disappears"]
# prettier-ignore
tags: ["software-architecture","frontend","react","performance","complexity"]
wiki_slug: architecture-must-earn-its-keep
created: 2026-07-29
updated: 2026-07-29
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19fa86ef4f3e7e84-07","url":"https://tanstack.com/blog/we-stopped-using-rsc-on-tanstack-com"}]
---

# Architecture Must Earn Its Keep

An architecture remains justified only while its measurable benefits exceed its ongoing runtime, tooling, serialization, and comprehension costs.

## Key Ideas

- Judge an architectural pattern against the concrete constraint it solves, not against its ecosystem status or conceptual appeal.
- A pattern can be the right choice initially and become the wrong choice after the underlying dependency, workload, or performance bottleneck changes.
- Re-measure the full system after simplifying the original bottleneck; a simpler architecture may preserve the earlier performance win.
- Include explanation cost, toolchain configuration, runtime boundaries, serialization, and coding-agent legibility in the architecture's continuing price.
- Supporting an advanced capability does not require making that capability foundational for every application.

## Source Notes

### [We Stopped Using RSC on TanStack.com](https://tanstack.com/blog/we-stopped-using-rsc-on-tanstack-com)

<!-- source-item-id: 19fa86ef4f3e7e84-07 -->

TLDR Dev, 2026-07-28.

## Related

- {% include wiki-related-link.md slug="interface-design-rules" %}
- {% include wiki-related-link.md slug="state-ownership-before-state-management" %}
