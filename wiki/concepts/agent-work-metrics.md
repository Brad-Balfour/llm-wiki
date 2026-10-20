---
type: concept
title: 'Agent Work Metrics'
# prettier-ignore
aliases: ["Human Cost of Agent Work"]
# prettier-ignore
tags: ["metrics", "ai-agents", "software-design", "code-review"]
wiki_slug: agent-work-metrics
created: 2026-10-19
updated: 2026-10-19
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261016-tldr-dev:dev-004","url":"https://cutler.sg/blog/2026-10-measure-agent-review-time"}]
---

# Agent Work Metrics

Michael Cutler's [How to Measure the Human Cost of Agent Work](https://cutler.sg/blog/2026-10-measure-agent-review-time)
(October 16, 2026) proposes a measurement protocol rather than reporting a
completed experiment. Register tasks and acceptance criteria before work starts,
and keep retries attached to the same task. Distinguish active human effort,
agent runtime and delivery turnaround; human effort includes briefing,
supervision, review, rework and verification.

Count rejected attempts, abandoned work, evaluator costs and manual rescue.
Divide cohort effort and spending by accepted tasks, preserving the distinction
between candidate acceptance, task completion and human takeover. The article's
synthetic example totals 45 human minutes and $6 across three tasks with two
accepted: 22.5 minutes and $3 per accepted task. With no accepted tasks, those
unit ratios are undefined.

Record missing measurements explicitly. Observed-only spending is a lower bound;
a subscription does not determine precise marginal task cost. Preserve totals
at the measurement cutoff and report later defect repairs separately. A claim
of savings requires comparable tasks and equivalent quality requirements.

## Saved Discussion and Software Factories

The October 19 commute explicitly requested a metrics entry linked to the
{% include wiki-related-link.md slug="review-driven-software-factories" %}
material. The practical synthesis is to evaluate accepted outcomes alongside
human attention and agent spending, rather than treating faster generation or
more merged pull requests as sufficient evidence of improvement. Timers alone
cannot establish quality or causal productivity gains. This is an evaluation
approach, not a workplace-specific implementation or a result measured here.

<!-- source-item-id: 20261016-tldr-dev:dev-004 -->
