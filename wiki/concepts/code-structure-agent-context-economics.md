---
type: concept
title: 'Code Structure as Agent Context Economics'
# prettier-ignore
aliases: ["The Economic Benefit of Refactoring","Refactoring for agent economics"]
# prettier-ignore
tags: ["ai-engineering","refactoring","context-management","software-design","cost-control","maintainability"]
wiki_slug: code-structure-agent-context-economics
created: 2026-08-03
updated: 2026-08-03
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19fb7fb144b8358d-01","url":"https://martinfowler.com/articles/exploring-gen-ai/refactoring-economic-benefit.html?utm_source=tldrdev"}]
---

# Code Structure as Agent Context Economics

Refactoring can lower the recurring context cost of agentic maintenance when coherent boundaries let an agent find and read the smallest relevant part of a codebase.

## Key Ideas

- Agent-facing maintainability has a recurring context-acquisition cost: poorly factored code makes each later change reread a larger surface.
- The benefit comes from discoverable, coherent boundaries rather than smaller files or fewer lines alone.
- A published single-application experiment reduced estimated input tokens for one repeated change by 83 percent while output tokens stayed broadly flat.
- The experiment is directional evidence, not a universal return-on-refactoring estimate: token counts were approximated and the full refactoring cost was not measured.
- Human judgment still chose and guided the refactorings; an agent did not independently identify or execute the most valuable structural change reliably.

## Structure Is a Retrieval Boundary

Refactoring has traditionally paid back through easier human comprehension and
safer change. Agentic development adds a measurable recurring cost: the input
context an agent must acquire before it can act. A monolithic module can force
every task to ingest the same broad surface. Coherent interfaces, extracted
responsibilities, and colocated behavior make it possible to identify a much
smaller relevant set.

File size alone is not the mechanism. Randomly splitting one large file can
leave an agent searching every fragment. The economic benefit appears when the
structure carries meaning: the agent can discover the right boundary and avoid
reading unrelated implementation.

## What the Experiment Shows

The source reports one agent-built application of roughly 150,000 lines, with a
17,155-line Rust data-access module. After a sequence of behavior-preserving
refactorings, the author repeatedly asked fresh subagents to make the same
representative change and discard it. Estimated input tokens fell from 159,564
to 27,360—an 83% reduction—while the data layer's total line count stayed
roughly constant and output-token use changed much less.

This supports a narrow claim: better locality can reduce repeated context
acquisition for a known change. It does not establish a general return on
refactoring. The experiment used one greenfield, single-developer application;
estimated tokens from character counts; did not capture the full refactoring
cost; and sampled one representative change amid nondeterministic generation.

## Human-Guided Maintenance Still Matters

The work also cuts against the idea that agents will automatically repair the
structure they degrade. The development harness already contained a refactoring
step, yet it did not surface the oversized module. Human prompting selected the
refactorings, mechanical edits were error-prone, and the highest-value split was
missed on the first pass.

The durable operating lesson is to inspect agent-generated code for entropy
before it becomes the context tax on every later task. That investment is most
compelling where duplicated setup, mixed responsibilities, or weak boundaries
force repeated broad reads—not merely where code was produced by an agent.

## Source Notes

### [The Economic Benefit of Refactoring](https://martinfowler.com/articles/exploring-gen-ai/refactoring-economic-benefit.html?utm_source=tldrdev)

<!-- source-item-id: 19fb7fb144b8358d-01 -->

TLDR Dev, 2026-07-31.

The article publishes the representative-change prompt and the refactoring
plan in its appendices, while removing the application-specific code changes.
That matters because the commute discussion was incorrectly told that the
prompts were unavailable. The source supports reproducing the procedure more
closely than that answer implied, although the missing codebase and approximate
measurement still prevent an exact replication.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="architecture-must-earn-its-keep" %}
- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
