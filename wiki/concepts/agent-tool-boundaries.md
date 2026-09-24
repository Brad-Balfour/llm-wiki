---
type: concept
title: 'Agent Tool Boundaries'
# prettier-ignore
aliases: ["Building Tools for AI Agents", "What changes when AI agents use your software"]
# prettier-ignore
tags: ["ai-agents", "tool-design", "identity", "reliability", "evaluation"]
wiki_slug: agent-tool-boundaries
created: 2026-09-24
updated: 2026-09-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"dev-010","url":"https://arize.com/blog/building-tools-for-ai-agents/"}]
---

# Agent Tool Boundaries

An agent using a product needs a clear account of whose authority it carries,
what an operation has actually done, and how to recover when a tool response is
uncertain. Tool access is part of the product's behavior, so a successful model
response alone does not prove that the customer's task completed.

## Practical Design Questions

- **Identity and scope:** Identify the person, the agent acting for them, the
  resources it may use, and when that grant expires. Services must enforce the
  scope; model instructions are not an access control.
- **Operation state:** Make accepted, running, completed, failed, and unknown
  outcomes distinguishable. After a timeout, check status before retrying an
  operation that may already have finished. A caller-supplied key prevents
  duplicates only if the server implements that guarantee.
- **Recovery and evaluation:** Test a real customer task across repeated runs
  and injected failures. Check the final artifact, unauthorized access,
  duplicate operations, elapsed time, and cost rather than treating a fluent
  answer or one successful run as proof of reliability.

## Commute Discussion

Brad explicitly saved the September 24 Dev item and asked for the article's
author, publication, and useful takeaways from the full source. The article is
by Aaron Winston on the Arize blog and develops an interview with Daytona
cofounder Ivan Burazin. Burazin's view that agents will become dominant users
of software is a forecast; the operational checks above are useful without
assuming it will occur. The commute assistant's attribution was not taken as
source verification; the published article was checked separately.

## Source Notes

### [What changes when AI agents use your software](https://arize.com/blog/building-tools-for-ai-agents/)

<!-- source-item-id: dev-010 -->

Aaron Winston, Arize, September 2026. The source URL redirects in presentation
to this title and discusses Ivan Burazin's experience and proposed engineering
responses. Explicitly saved during the September 24 Dev commute.

## Related

- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
