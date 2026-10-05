---
type: concept
title: 'Structured Decision Models'
# prettier-ignore
aliases: ["System One Models", "Jev"]
# prettier-ignore
tags: ["ai-agents", "structured-output", "decision-making", "workflow-design"]
wiki_slug: structured-decision-models
created: 2026-09-16
updated: 2026-10-05
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a0aa73e4e492655-02","url":"https://typesafe.ai/blog/introducing-system-one-models-and-jev"},{"source_item_id":"20260922-tldr-dev:dev-01","url":"https://archerhume.com/posts/jevs-architecture-unmasked"},{"source_item_id":"dev-002","url":"https://magazine.sebastianraschka.com/p/classifier-history-and-jev"},{"source_item_id":"dev-011","url":"https://swapniltalekar.substack.com/p/jev-and-the-return-of-the-classifiers"},{"source_item_id":"ai-010","url":"https://strandsagents.com/blog/introducing-strands-decider/"}]
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

## Classification Interfaces and Application Thresholds

Sebastian Raschka's September 29 survey traces text classification from
bag-of-words through embeddings, recurrent/convolutional networks, and
transformer classification heads to generated labels. It describes Jev as a
general classification interface; a specialized classifier may still be better
at high volume. Choice returns a label, probabilities, and a concentration-based
confidence measure, which differs from the winning class probability. Noul
returns a yes probability for each independent question; Score supports ordinal
rubrics. These outputs need calibration checks on representative held-out labels.
The model's proprietary internals remain unverified.

The October 2 Dev discussion saved both this survey and the separate
_Jev and the Return of the Classifiers_ item. Its practical synthesis separates
model output from application policy:

- A yes/no probability need not include a separate uncertainty or null state.
  That does not imply every Jev interface returns only one number.
- Two cutoffs can map low probabilities to automatic negatives, high
  probabilities to automatic positives, and the middle to human or slower-model
  review. Escalation is application logic, not a special model output.
- A cutoff means sufficiently reliable for that action, not definitely correct.
  A single threshold can suffice when the question itself is whether a human
  should be involved.
- Tune thresholds to validation outcomes and the asymmetric costs of misses,
  false alarms, interruptions, and review. Cheap inference does not eliminate
  labeling, calibration, monitoring, or human effort.

The discussion considered both personal and workplace decisions; it establishes
an evaluation approach, not permission to deploy on confidential work data.

## Strands Decider: Open Weights and Operating Costs

The October 5 AI commute explicitly saved Amazon Strands Decider 2B with
its AWS relationship and free/open-source status. The October 1 release
presents a constrained decision model: a pointer head scores the supplied
options in one pass instead of generating an open-ended answer. This makes
its interface useful for routing and classification; representative validation
is still needed before trusting its decisions.

The Strands Labs project is affiliated with Amazon/AWS. Its code repository
and the release's v19 model checkpoint specify Apache-2.0 licensing. The
weights can be downloaded and run locally; AWS hosting is not required.
“Free to download” does not mean zero operating cost: local inference consumes
hardware resources, and a separately hosted LLM or cloud service can carry
its own charges. The release example's Bedrock LLM is a separate component
from Decider. These distinctions answer the saved commute questions without
assuming that AWS affiliation makes every part of an application free.

## Source Notes

### [Language Models for Text Classification: From Bag-of-Words to Jev](https://magazine.sebastianraschka.com/p/classifier-history-and-jev)

<!-- source-item-id: dev-002 -->

Sebastian Raschka, 2026-09-29. Read directly for the October 2 explicit save.
The survey separates classification interfaces, empirical testing, and unknown
internals. Its experiments do not prove production calibration for this project.

### [Jev and the Return of the Classifiers](https://swapniltalekar.substack.com/p/jev-and-the-return-of-the-classifiers)

<!-- source-item-id: dev-011 -->

Explicitly saved with the probability and threshold discussion. The exact URL,
an alternate rendering, exact-title search, and publisher homepage did not
provide a readable article. The section above preserves commute synthesis;
it does not attribute unverified detailed claims to this article. The source
remains retryable.

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

### [Introducing Strands Decider](https://strandsagents.com/blog/introducing-strands-decider/)

<!-- source-item-id: ai-010 -->

Marc Brooker, Mike Chambers, and Fabio Nonato de Paula, 2026-10-01. Read
directly for the October 5 explicit save. The [code repository](https://github.com/strands-labs/strands-decider)
and [v19 checkpoint](https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19)
verify Apache-2.0 licensing; the [AWS Strands Labs announcement](https://aws.amazon.com/blogs/opensource/introducing-strands-labs-get-hands-on-today-with-state-of-the-art-experimental-approaches-to-agentic-development/)
confirms affiliation. The release describes v19; later repository versions
are not silently attributed to that article. Cost distinctions above are
practical synthesis of the deployment choices, not a claim of free hosted
inference.

## Related

- {% include wiki-related-link.md slug="llm-classification-as-feature-engineering" %}

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
