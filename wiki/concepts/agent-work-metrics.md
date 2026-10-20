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
(October 16, 2026) proposes a protocol, not experimental findings. Register tasks
and acceptance criteria first; attach every retry to its task. Separate human
briefing, supervision, review, rework and verification from agent runtime and
turnaround.

Include rejected attempts, abandonment, evaluators and manual rescue. Divide
cohort effort and spending by accepted tasks; distinguish acceptance, completion
and human takeover. The synthetic example uses 45 human minutes and $6 across
three tasks, two accepted: 22.5 minutes and $3 per acceptance. Zero acceptances
make unit ratios undefined.

Mark missing measurements; observed-only spending is a lower bound. Subscriptions
do not establish marginal task cost. Preserve cutoff totals and report later
repairs separately. Compare equivalent tasks and quality requirements before
claiming savings.

## Saved Discussion and Software Factories

The October 19 commute explicitly requested a metrics entry linked to the
{% include wiki-related-link.md slug="review-driven-software-factories" %}
material. The practical synthesis is to evaluate accepted outcomes alongside
human attention and agent spending, rather than treating faster generation or
more merged pull requests as sufficient evidence of improvement. Timers alone
cannot establish quality or causal productivity gains. This is an evaluation
approach, not a workplace-specific implementation or a result measured here.

<!-- source-item-id: 20261016-tldr-dev:dev-004 -->
