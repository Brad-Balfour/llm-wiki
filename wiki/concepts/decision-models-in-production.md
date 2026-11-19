---
type: concept
title: 'Decision Models in Production'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: decision-models-in-production
created: 2026-11-18
updated: 2026-11-18
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261110-tldr-dev:dev-002","url":"https://newsletter.posthog.com/p/decision-models"}]
---

# Decision Models in Production

[Jina Yoon's PostHog article](https://posthog.com/newsletter/decision-models)
describes typed, probabilistic judgments inside otherwise deterministic
pipelines. The same interface can answer yes/no questions, choose among
options, or score one input. The thresholds depend on the cost of the error
and need recalibration when the model or task changes.

- **Privacy gate.** Replay Vision checks for a real name and for contact
  details or an identifier independently. If either score reaches 0.4,
  Gemini rewrites the summary and the decision model checks the rewrite.
  PostHog reports that 98.7% of production summaries avoided the rewrite.
  Its [offline comparison](https://github.com/PostHog/posthog/pull/120387)
  found 29% recall for the old model at 0.8 and 97% for Jeeves at 0.4.
  False flags fell from 20 of 45 to one of 45 on labeled negatives. The
  model, question wording and threshold all changed, and the labels came
  from an LLM.
- **Slack gate and model routing.** Two separate decisions check whether an
  untagged message asks a question PostHog can answer. Both must reach 0.85.
  For a tagged request without an explicit model, the router considers
  capability and relative cost, accounting for the cost of a failed attempt.
- **Reranking.** Embeddings choose the initial candidates. A second model
  scores each candidate against the query independently. This reduces a
  ranking task to small judgments and lets search preserve its original
  ordering if scoring fails or times out. PostHog reported about 25% better
  ranking quality on 20 test queries after reranking 20 candidates per query.
- **Error grouping and charts.** PostHog reports that thresholds changed
  between versions of the same model, prompting per-project thresholds,
  human labeling and shadow evaluation. Chart inference uses SQL and output
  metadata to suggest a visualization and axes.
- **Conditional reasoning.** PostHog describes Jeeves as a decision model
  that can reason on uncertain inputs. Larger batches and complex judgments
  can defeat the latency or quality advantages of a narrow decision call.
  A batch job with requests of 12,000–38,000 tokens saturated a shared
  server in one experiment. A five-question attempt to prioritize code
  review findings reached AUC 0.52.

## Discussion

The commute asked what a team already using Decisions API and Jev would learn
from operating these pipelines. The discussion emphasized explicit handling of
timeouts and changing schemas. For example, bound reranking to a small set of
permission-filtered candidates and keep the original order as a fallback.
Before reusing a chart choice, check that the returned columns still fit it and
honor a manual override. A deterministic match can still handle clear cases of
error grouping, leaving uncertain matches for a learned judgment in shadow
mode.

The discussion also cautioned against treating model-labeled evaluation as
human ground truth. Before choosing a decision model, measure errors under
representative traffic and cost both outcomes. A privacy miss can expose data.
A false positive in an untagged Slack channel can interrupt a conversation.
Those costs explain why even two superficially similar gates use different
thresholds. The same evaluation principle applies when testing a model for
structured commute decisions.

<!-- source-item-id: 20261110-tldr-dev:dev-002 -->
