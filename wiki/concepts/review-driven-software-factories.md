---
type: concept
title: 'Review-Driven Software Factories'
# prettier-ignore
aliases: ["Why Software Factories Fail","Human-in-the-loop software factories","Agentic documentation workflows"]
# prettier-ignore
tags: ["ai-agents","software-design","planning","code-review","context-management","documentation","workflow-automation"]
wiki_slug: review-driven-software-factories
created: 2026-07-25
updated: 2026-08-06
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"dev-20260724-01","source_path":"sources/tldr/2026-07-24-why-software-factories-fail.txt","url":"https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md"}]
---

# Review-Driven Software Factories

Reliable AI-assisted software development treats specifications, plans, and review decisions as durable source artifacts while using agents to accelerate bounded implementation work.

## Key Ideas

- Review leverage is highest upstream, before implementation multiplies an incorrect product or architecture decision.
- Plans and specifications preserve intent across context compaction and model handoffs.
- Subagents isolate noisy exploration, but human alignment and accountable review remain necessary.
- The source presents experience-driven practices rather than strongly validated universal rules.

## Operating Model

1. Review the product intent before agents turn it into architecture.
2. Review the architecture before implementation multiplies its assumptions.
3. Keep the accepted specification and plan as source artifacts that survive
   context-window changes.
4. Give implementation agents bounded tasks and compact only after durable
   decisions have been written down.
5. Review for mental alignment with the system's intent, supported by tests and
   targeted code inspection, instead of pretending exhaustive line-by-line
   reading is always possible.

Subagents are useful here as context-isolation boundaries: research, review, and
implementation can happen without filling the main decision context with every
intermediate detail. They do not make accountability or cross-boundary review
optional.

## Documentation as a Review-Driven Propagation Workflow

Documentation drift across repositories is a useful concrete instance of this
operating model. A merged product change can trigger an agent that decides
whether user-facing documentation is needed, drafts the change in the docs
repository, and opens a review request for the engineer who approved the
feature. The agent performs the mechanical propagation; the subject-matter
expert remains accountable for correctness.

The reliable boundary is narrower than “let an agent update documentation”:

- Resolve release branches and other routing metadata deterministically before
  invoking the model.
- Give the agent read access and let it emit structured write intent rather
  than granting it unrestricted repository writes.
- Materialize that intent through scoped tooling with allow-listed repositories,
  branches, labels, and protected files.
- Keep generated documentation pull requests as drafts and assign the engineer
  who reviewed the product change as the documentation reviewer.
- Teach the docs-worthiness gate with negative examples such as CI-only,
  tests-only, dependency, logging, and internal-refactor changes.
- Fall back to a visible issue when the write path fails so work is not silently
  lost.

GitHub reports that the Aspire team ran this check on 396 merged product pull
requests during a 30-day window. The workflow created 82 documentation pull
requests, all of which merged, with a reported median merge time of 44.8 hours.
Those results are one team's operational evidence, not a general benchmark, but
they demonstrate an important shape: frequent automated judgment can coexist
with sparse writes, constrained authority, and human approval.

## Source Notes

### [Why Software Factories Fail](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md)

<!-- source-item-id: dev-20260724-01 -->

TLDR Dev, 2026-07-24.

This page preserves the article's practical model and the July 24 commute
discussion. The recommendations are experience-driven; they are useful design
hypotheses, not strong empirical evidence that this workflow is universally
optimal.

### [Automating cross-repo documentation with GitHub Agentic Workflows](https://github.blog/ai-and-ml/github-copilot/automating-cross-repo-documentation-with-github-agentic-workflows/?utm_source=tldrdev)

<!-- source-item-id: 19fd6c96b2d39a67-11 -->

TLDR Dev, 2026-08-06.

GitHub's Aspire case study supplies the concrete cross-repository workflow,
security boundary, failure lessons, and reported 30-day results. The published
numbers describe one team after prompt tightening and should not be treated as
an independent comparison with manual documentation processes.

## Related

- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
