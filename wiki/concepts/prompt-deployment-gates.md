---
type: concept
title: 'Prompt Deployment Gates'
# prettier-ignore
aliases: ["Treat prompt changes like code deploys","Prompt CI/CD"]
# prettier-ignore
tags: ["ai-engineering","prompts","evaluation","quality-gates","deployment","observability"]
wiki_slug: prompt-deployment-gates
created: 2026-07-31
updated: 2026-07-31
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19fb2b55e8becbaa-06","source_path":"sources/tldr/2026-07-30-prompt-deployment-gates.txt","url":"https://luke.geek.nz/azure/eval-gates-for-prompts/"}]
---

# Prompt Deployment Gates

Prompt changes are production-affecting configuration and should move through immutable versions, representative evaluations, explicit promotion gates, production observation, and fast rollback rather than ad hoc edits.

## Key Ideas

- Prompt regressions often return plausible successful responses, so transport health cannot substitute for output evaluation.
- A promotion gate should fail closed unless the latest candidate version has a passing evaluation run and should return actionable failure evidence.
- Offline evaluation should grow into a feedback loop in which production failures become durable regression cases.
- Evaluation tooling can compare immutable versions, but the surrounding CI policy and human authority may still own the actual promotion decision.
- A gate remains credible only when the common path is fast, failures are understandable, and emergency overrides are audited.

## Version the Behavioral Configuration

The commute discussion treated prompt CI/CD as a useful application of familiar
deployment practice rather than a fundamentally new engineering model. Its
durable extension is that a prompt is often only one part of the behavior being
deployed.

Tool schemas, retrieval configuration, model versions, sampling parameters,
context compaction, and cache policy can all change the same agent's behavior.
Evaluation evidence and rollback are incomplete when they identify only the
prompt version but not these coupled dependencies. A production pipeline should
therefore either version the behavioral configuration as one release unit or
record an explicit compatibility set that can be restored together.

## Source Notes

### [Treat prompt changes like code deploys](https://luke.geek.nz/azure/eval-gates-for-prompts/)

<!-- source-item-id: 19fb2b55e8becbaa-06 -->

TLDR, 2026-07-30.

### [Prompt CI/CD: version, gate, and roll out prompts like code](https://langfuse.com/resources/engineering/prompt-cicd)

The commute discussion used this implementation guide as a second reference.
It distinguishes native prompt versioning and evaluation features from approval
and traffic-splitting behavior that the surrounding delivery system must
compose.

## Related

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
