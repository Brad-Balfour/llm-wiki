---
type: concept
title: 'Counting House for Customer Casework'
aliases: ['The Counting House']
tags: ['ai-agents', 'workflow-automation', 'governance', 'customer-service']
wiki_slug: counting-house-customer-casework
created: 2026-11-07
updated: 2026-11-07
confidence: medium
provenance:
  [
    {
      'source_item_id': '20261027-tldr:general-006',
      'url': 'https://yegge.ai/essays/the-counting-house/',
    },
  ]
---

# Counting House for Customer Casework

[Steve Yegge's Counting House](https://yegge.ai/essays/the-counting-house/) proposes a governed architecture for high-volume customer contacts. A fresh, stateless **clerk** handles a case under an intent-specific policy specifying model, tools and permitted autonomy. Channel adapters accept contacts such as email, SMS and WhatsApp; a gateway removes personal information before model access. Yegge describes evaluating voice transcripts after a call and says he has not seen the approach used for live voice; the commute discussion's broader live-voice assumption is not established by the article.

A separate **judge** evaluates candidate models against a human-scored gold set and scores other contacts for quality and trends, after being tested against human agreement. An intent policy governs promotion and autonomy, with error costs and confusion between intents informing the decision. A mechanical **orchestrator**, rather than the model, validates write intents and executes approved multi-step transactions, with idempotency, approvals, compensating actions and exception handling. Clerks do not hold write credentials for systems of record. This differs from Yegge's more persistent, exploratory Wheelhouse software agents.

The commute discussion asked what this adds beyond an existing support agent: the useful distinction is not merely model routing but measured per-intent performance, explicit autonomy, transaction controls and a feedback loop from recurring contacts to business owners. The discussion also proposed investigations triggered by operational events before customers contact support. That proactive extension and a judge initiating investigations are ideas from the conversation, not claims that Yegge's described system does those things. Any adoption would need independent evaluation of existing systems, cost, quality and human oversight.

<!-- source-item-id: 20261027-tldr:general-006 -->
