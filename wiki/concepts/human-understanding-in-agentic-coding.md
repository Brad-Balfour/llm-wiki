---
type: concept
title: 'Human Understanding in Agentic Coding'
# prettier-ignore
aliases: ["Understanding is the new bottleneck","Code explainers","Literate diffs","Micro-worlds for code understanding"]
# prettier-ignore
tags: ["ai-agents","software-engineering","code-comprehension","code-review","developer-workflow","human-oversight","collaboration"]
wiki_slug: human-understanding-in-agentic-coding
created: 2026-08-16
updated: 2026-08-16
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a00013ac9bf7ecf-03","url":"https://www.geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck?utm_source=tldrdev"}]
---

# Human Understanding in Agentic Coding

When agents can produce code faster than people can absorb it, human
understanding becomes a constraint on creative participation, not only a final
correctness check. The response is to build better comprehension artifacts and
interactive learning environments around generated systems.

## Key Ideas

- Understanding lets a person propose the next meaningful change, not merely
  approve or reject the current one.
- A raw diff is only one representation of a change; structured explainers can
  teach prerequisites, intent, intuition, and code in a more useful order.
- Quizzes act as a speed regulator by testing whether understanding kept pace
  with generation.
- Small interactive micro-worlds can let a person manipulate a system and
  build intuition faster than passive explanation alone.
- Teams also need shared spaces and vocabulary so understanding survives
  beyond one developer-agent pair.

## Understanding to Participate

Geoffrey Litt separates verification from participation. Verification asks
whether a result matches a specification or quality bar. Participation requires
a rich enough mental model to generate ideas, discuss tradeoffs, and steer the
next iteration. Better agent self-checking can reduce some verification work,
but it does not automatically supply that human mental model.

The source is the written version of a 2026 AI Engineer conference talk by a
Design Engineer at Notion. It is a practitioner thesis illustrated with
workflow examples, not a controlled comparison demonstrating that its methods
outperform ordinary review across teams or codebases.

## Explanation Artifacts and Checks

Litt's `/explain-diff` workflow produces HTML, Markdown, or Notion explainers.
The artifact teaches relevant background, states the goal and intuition before
implementation detail, and presents code in a prose-driven “literate diff”
rather than filesystem order. He still reads the raw diff, but uses the
explainer first.

An interactive quiz follows the explanation. His rule is not to send or review
code until he can pass it. This turns comprehension into an explicit gate and
counterbalances an agent loop that can otherwise outrun the human. It is a
personal operating rule from the source, not a universal merge policy.

## Micro-Worlds

The interactive examples are concrete tools for developing intuition rather
than a general architecture-analysis framework:

- A Prolog interpreter debugger lets the developer step through time, inspect
  the stack and evaluated rules, and leave notes while learning execution.
- A website-migration command center lets the developer perform a generated
  port incrementally while observing the old and new sites and the evolving
  file tree side by side.

In both cases the agent writes code that helps the person understand other
code. The point is not to delegate debugging or migration entirely, but to make
direct manipulation faster and more legible.

## From Solo Comprehension to Shared Understanding

Most detailed examples concern systems Litt's own agents are building, but the
talk also extends the idea to team work. Collaborative explainer documents,
technical plans, comments, and shared environments can create a common mental
model for reviewing and evolving a system together.

The commute discussion made this boundary explicit. Personal comprehension and
team review are related but not identical: a micro-world can teach one person a
mechanism, while a team also needs durable artifacts, vocabulary, and a place
to challenge the model together. Neither should be mistaken for proof that the
generated system is correct.

## Source Notes

### [Understanding is the new bottleneck](https://www.geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck?utm_source=tldrdev)

<!-- source-item-id: 1a00013ac9bf7ecf-03 -->

TLDR Dev, 2026-08-14.

The source supplies the participation thesis, explainer and quiz workflow,
micro-world examples, and shared-space extension. The solo-versus-team framing
and explicit evidence qualification preserve the saved commute discussion as
synthesis rather than attributing a controlled result to the talk.

## Related

- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
