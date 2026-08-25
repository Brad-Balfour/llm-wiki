---
type: concept
title: 'Evidence-Accumulating Problem Discovery'
# prettier-ignore
aliases: ["Problem discovery for staff engineers","Absorb problems, not requests"]
# prettier-ignore
tags: ["engineering-leadership","staff-engineering","problem-discovery","product-strategy","developer-tools"]
wiki_slug: evidence-accumulating-problem-discovery
created: 2026-08-24
updated: 2026-08-24
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"1a0337ee8f70b5bf-03","url":"https://lalitm.com/post/find-problems-staff-engineer/?utm_source=tldrdev"}]
---

# Evidence-Accumulating Problem Discovery

Staff-level problem discovery is an evidence loop: absorb recurring friction,
separate underlying needs from requested solutions, wait for patterns to
emerge, and pressure-test the common shape before committing to build.

## Key Ideas

- Listen for problems in ordinary engineering work instead of waiting for a
  planning exercise or management assignment. Conversations, bug
  investigations, and direct observation reveal constraints that a feature
  request often hides.
- Treat requests as clues rather than specifications. Ask what outcome a team
  needs and why existing tools fail before accepting its proposed solution.
- Let candidate problems accumulate. Independent recurrence across teams is
  stronger evidence than urgency from one vocal requester, and waiting can
  reveal that apparently different requests share one enabling capability.
- Treat an elegant common shape as a hypothesis, not proof. Use direct
  observation, throwaway prototypes, RFCs, and stakeholder feedback to test
  demand, feasibility, and whether one design really serves every case.
- Finding and shaping the right problem does not require owning every
  implementation. The durable staff-engineering contribution may be a shared
  primitive, a roadmap change, or a well-framed opportunity another engineer
  delivers.

## From Requests to a Common Shape

The source's Perfetto example begins with unrelated requests: pinned tracks,
custom startup views, specialized aggregations, and bookmarklet workarounds.
The shared need was not a larger collection of built-in features. Teams needed
to adapt Perfetto to their own workflows without imposing those choices on
everyone else. Macros and extension servers addressed that common shape and
avoided making the core team the owner of each customization.

The counterexample is equally important. A proposed transparent cache appeared
to unify repeated-query performance and reopening large traces. Prototyping and
design work showed that the similarity was superficial: warm in-memory
sessions and streaming export were better separate solutions. Accumulated
evidence helps discover a common shape, but pressure-testing determines whether
it is real.

## A Practical Problem Map

The commute discussion suggests making the implicit accumulation step visible
without turning it into a feature backlog. Keep a lightweight map of repeated
friction, affected workflows, observed root needs, recurrence, and disconfirming
evidence. Revisit an entry when another independent signal arrives. Promote it
to active design work only when the evidence supports a meaningful common
shape and the likely solution is worth owning.

This map should preserve uncertainty. Its purpose is to improve judgment and
connect signals, not to make every complaint look like committed work.

## Source Notes

### [How I Find Problems to Solve as a Staff Engineer](https://lalitm.com/post/find-problems-staff-engineer/?utm_source=tldrdev)

<!-- source-item-id: 1a0337ee8f70b5bf-03 -->

TLDR Dev, 2026-08-24. Lalit Maganti describes finding staff-level work by
absorbing problems, letting them accumulate, identifying a common shape, and
pressure-testing the resulting hypothesis. The commute discussion emphasized
the Perfetto example, the danger of elegant but false unification, and the value
of solving shared needs without becoming the owner of every one-off request.

## Related

- {% include wiki-related-link.md slug="decision-driven-roadmaps" %}
- {% include wiki-related-link.md slug="reality-driven-ai-product-development" %}
- {% include wiki-related-link.md slug="state-ownership-before-state-management" %}
