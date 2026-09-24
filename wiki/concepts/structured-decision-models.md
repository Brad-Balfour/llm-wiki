---
type: concept
title: 'Structured Decision Models'
# prettier-ignore
aliases: ["System One Models", "Jev"]
# prettier-ignore
tags: ["ai-agents", "structured-output", "decision-making", "workflow-design"]
wiki_slug: structured-decision-models
created: 2026-09-16
updated: 2026-09-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a0aa73e4e492655-02","url":"https://typesafe.ai/blog/introducing-system-one-models-and-jev"},{"source_item_id":"20260922-tldr-dev:dev-01","url":"https://archerhume.com/posts/jevs-architecture-unmasked"}]
---

# Structured Decision Models

TypeSafe AI presents System One Models and Jev as a way to turn messy input
into typed, probabilistic judgments for constrained decisions. The proposed
workflow is narrower than open-ended chat: define the choices and expected
output shape, obtain a judgment with a confidence value, and let ordinary code
apply thresholds, validate the result, or escalate uncertainty. Typed output
can prevent malformed answers; it does not establish that the underlying
judgment is true or well calibrated.

## Commute Discussion And Practical Fit

During the September 16 AI commute, Brad asked whether Jev was open-source or
a paid service, what its pricing meant, and whether a cheaper structured
judgment stage could fit the LLM-Wiki-Car post-commute laptop/Codex workflow.
The vendor describes hosted early access and advertises input-token pricing;
the current license, terms, and actual costs need checking before adoption.
Its benchmark, latency, and calibration figures are vendor claims, not
independent evidence for this workflow.

A bounded trial could use a well-defined decision—such as whether a validated
commute capture is an exact classifier correction, a wiki save, or a playback
incident—then compare Jev's outputs against deterministic rules and manually
reviewed examples. The model should not replace canonical queue/reference
validation or invent a missing source ID. If it saves time or money without
losing recall on explicit user actions, it could become an optional triage
step; if not, the current deterministic path remains preferable.

Brad also asked about direct use during Live Voice. This source does not prove
a working ChatGPT Voice plugin or tool integration. That is a separate
feasibility question from post-commute use through an API or local workflow.

The September 23–24 Dev discussion examined whether Jev is a distinct decision
model or an LLM merely returning numbers, and how a team should first test it.
The saved follow-up essay reports black-box API probes, including question
isolation, shared-context behavior, option-order sensitivity, and probabilities
read without ordinary token-by-token text generation. These observations do not
reveal the implementation uniquely. In particular, its proposed sparse
mixture-of-experts backbone is an inference, not a verified design.

For a first workplace trial, the discussion suggested a small labeled set from
one real decision workflow. Check calibration against outcomes, permute answer
order, and test whether sibling questions can influence one another. Compare
error, latency, and cost with the existing path before applying score
thresholds. This is an evaluation plan, not a conclusion that Jev is suitable
for the commute workflow.

## Source Notes

### [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

<!-- source-item-id: 1a0aa73e4e492655-02 -->

Diogo Almeida, TypeSafe AI. Explicitly saved during the September 16 AI
commute with a request to retain the surrounding pricing, deployment, and
LLM-Wiki-Car integration discussion.

### [Jev's Architecture Unmasked](https://archerhume.com/posts/jevs-architecture-unmasked)

<!-- source-item-id: 20260922-tldr-dev:dev-01 -->

Archer Hume, 2026-09-17. Explicitly saved during the September 23–24 Dev
commute with a request to retain the discussion and first-use cautions. The
essay separates API observations from architectural hypotheses; the source
does not prove Jev's internal model family or training recipe.

## Related

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
