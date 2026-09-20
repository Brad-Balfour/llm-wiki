---
type: concept
title: 'LLM Classification as Feature Engineering'
# prettier-ignore
aliases: ["LLM classifiers", "Classifier feature extraction"]
# prettier-ignore
tags: ["classification", "evaluation", "llm", "machine-learning"]
wiki_slug: llm-classification-as-feature-engineering
created: 2026-09-20
updated: 2026-09-20
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a0b4c0b55707f18-05","url":"https://minimallysufficient.com/posts/llm-classification-is-feature-extraction/"}]
---

# LLM Classification as Feature Engineering

An LLM can turn unstructured input into a useful verdict or a set of features,
but its output alone is not automatically calibrated, thresholdable, or
auditable. Treating that output as one input to an evaluated decision system
makes those limitations explicit.

## Key Ideas

- A hard LLM label has no inherent calibrated probability or principled
  precision/recall operating point.
- A fitted model can use the LLM verdict, LLM-extracted subfeatures, and
  deterministic signals together; it can then expose probabilities, thresholds,
  and feature contributions for evaluation.
- Error analysis should drive feature hypotheses. Prompt wording is not proof
  that a model used a requested signal.
- A test set is required even for prompt-only classification. It should include
  source-inventory recall so omitted candidates are visible, not only retained
  candidates that were already easy to inspect.

## Deployment Boundary

The source's logistic-regression example is a useful experimental design, not a
drop-in replacement for a cloud-only queue-generation workflow. Adding a trained
runtime, labels, calibration, and retraining changes the operating system and
must earn that complexity. The immediately useful control is to preserve
structured, inspectable classifier reasons and audit false exclusions against
the original newsletter inventory.

## Source Notes

### [LLM Classification Is Feature Engineering](https://minimallysufficient.com/posts/llm-classification-is-feature-extraction/)

<!-- source-item-id: 1a0b4c0b55707f18-05 -->

The article argues that LLM verdicts can be treated as features in a conventional
model, then demonstrates calibration and additional LLM and rule-based features
on irony detection. The deployment boundary and source-inventory-recall emphasis
are commute-derived synthesis.

## Related

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="evidence-accumulating-problem-discovery" %}
