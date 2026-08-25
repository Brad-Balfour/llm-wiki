---
type: concept
title: 'Architecture Must Earn Its Keep'
# prettier-ignore
aliases: ["Architecture should keep earning its keep","Remove architecture after its original constraint disappears","Worse is better","Most rewrites serve the engineer, not the business"]
# prettier-ignore
tags: ["software-architecture","frontend","react","performance","complexity"]
wiki_slug: architecture-must-earn-its-keep
created: 2026-07-29
updated: 2026-08-24
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19fa86ef4f3e7e84-07","url":"https://tanstack.com/blog/we-stopped-using-rsc-on-tanstack-com"},{"source_item_id":"url_ac4089e40b9f0b49","url":"https://blog.ploeh.dk/2026/06/29/worse-is-better/"},{"source_item_id":"url_ccd4fcf66f1fde65","url":"https://anatoliybabushka.com/blog/when-to-rewrite-working-code.html"}]
---

# Architecture Must Earn Its Keep

An architecture remains justified only while its measurable benefits exceed its ongoing runtime, tooling, serialization, and comprehension costs.

## Key Ideas

- Judge an architectural pattern against the concrete constraint it solves, not against its ecosystem status or conceptual appeal.
- A pattern can be the right choice initially and become the wrong choice after the underlying dependency, workload, or performance bottleneck changes.
- Re-measure the full system after simplifying the original bottleneck; a simpler architecture may preserve the earlier performance win.
- Include explanation cost, toolchain configuration, runtime boundaries, serialization, and coding-agent legibility in the architecture's continuing price.
- Supporting an advanced capability does not require making that capability foundational for every application.
- Popularity is evidence about ecosystem fit, not proof that one technology dominates every relevant design axis.
- A rewrite needs a measurable forcing function because working code contains operational knowledge that a clean replacement can silently discard.

## Popularity Is One Design Dimension

Mark Seemann revisits “worse is better” to argue that the mainstream choice may
win through incremental adoption, ecosystem strength, or compatibility rather
than superiority on every axis. Choosing the common option is often rational,
but an architect should still identify the property that matters for the actual
workload instead of treating popularity as a total ordering.

The less common alternative also has costs: a smaller ecosystem can mean more
custom work and harder hiring. The decision is a contextual tradeoff, not a
reflex to choose the contrarian tool.

## Rewrites Must Recover the Old System's Memory

Anatoliy Babushka describes production code as a ledger of incidents already
fixed. Strange retries, timeouts, and conditionals may be scar tissue whose
rationale is missing from the source. AI reduces the typing cost of a rewrite,
but not the cost of rediscovering that history, migrating behavior, or proving
that the replacement is complete.

A defensible rewrite has a forcing function that can be stated concretely: an
unsupported runtime, an exposed vulnerability, a quantified delivery tax, a
single-person continuity risk, or a required capability the current design
cannot support. Preserving the reasons behind existing behavior is part of the
migration, especially when an agent writes the replacement.

## Source Notes

### [We Stopped Using RSC on TanStack.com](https://tanstack.com/blog/we-stopped-using-rsc-on-tanstack-com)

<!-- source-item-id: 19fa86ef4f3e7e84-07 -->

TLDR Dev, 2026-07-28.

### [Worse is better](https://blog.ploeh.dk/2026/06/29/worse-is-better/)

<!-- source-item-id: url_ac4089e40b9f0b49 -->

Mark Seemann, 2026-06-29. Introduces a series about cases where a popular
technology may be inferior on a dimension that matters to a specific workload.

### [Most rewrites serve the engineer, not the business](https://anatoliybabushka.com/blog/when-to-rewrite-working-code.html)

<!-- source-item-id: url_ccd4fcf66f1fde65 -->

Anatoliy Babushka, 2026-06-30. Argues that cheaper code generation does not
remove the rediscovery and operational-memory costs of replacing working code.

## Related

- {% include wiki-related-link.md slug="interface-design-rules" %}
- {% include wiki-related-link.md slug="state-ownership-before-state-management" %}
- {% include wiki-related-link.md slug="compiler-owned-react-optimization" %}
