---
type: tool
title: 'Clairic Extraction Model'
aliases: ['Clairic']
tags: ['structured-output', 'document-extraction', 'cloudflare', 'system-one']
wiki_slug: clairic-extraction-model
created: 2026-10-23
updated: 2026-10-23
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261020-tldr-ai:ai-003","url":"https://blog.cloudflare.com/clairic-extraction-model"}]
---

# Clairic Extraction Model

Clairic turns unstructured input into typed fields rather than a generated
answer. It is relevant when an application needs values from documents, with
ordinary code handling later calculations and validation.

## Announcement and Model Boundary

Alex Reneau, Michelle Chen and Kevin Flansburg introduced Clairic on the
Cloudflare Blog on October 19, 2026. The announcement presents a preview
System One extraction model on Workers AI. Its receipt-photo example extracts
amounts, an order number and purchase time. It does not demonstrate pay-stub
extraction. The article describes single-pass inference without generated answer
tokens and recommends code for arithmetic and aggregation. A stated intention
to release open weights is not an already available open-source release.
[Original announcement](https://blog.cloudflare.com/clairic-extraction-model).

Decision models select among predefined options; extraction models return typed
values. Cloudflare's concepts documentation distinguishes extracting values explicitly
present in input from computing derived values, estimating unknown outcomes and
forecasting future sequences. Typed output does not establish correctness.
A null can mean that information is absent or that the model failed to find it;
confidence and source-text spans are useful evidence, not a substitute for
checking the result. [Extraction-model concepts](https://developers.cloudflare.com/workers-ai/concepts/extraction-models/).

## Hosted Access, Inputs and Cost

The October 23 model reference documents hosted calls to
`@cf/cloudflare/clairic` through a Workers AI binding or REST endpoint, with
JavaScript and Python examples. Text can be accompanied by up to four embedded
PNG, JPEG or WebP images. Limits are 4 MiB per image, 8 MiB decoded images in
total and 16 MiB for the request body; remote image URLs are rejected.
Native PDF input is not documented. The hosted-use terms do not establish an
open-source license or currently available self-hosting.
[Model reference](https://developers.cloudflare.com/workers-ai/models/clairic/).

The published rate is $0.10 per million input tokens. Workers AI provides a
shared allowance of 10,000 neurons per day, resetting at midnight UTC; use above
the allowance requires the Paid plan. This is not a fixed number of free
receipts or a Clairic-only allowance: document size, field definitions and
inference passes affect usage. Recheck the live rate and terms before adopting
it. [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Commute Discussion and Application Synthesis

The October 23 discussion asked who makes and hosts Clairic, whether it is open
source or paid, how an application calls it, what the free allowance covers,
and which input formats it accepts. Brad's practical interest is extracting
fields from receipts and potentially pay stubs. He explicitly separated this
from asking a model to do arithmetic. These are use cases and preferences,
not tested vendor capabilities or benchmark results.

A possible application would extract printed fields, retain source evidence and
uncertainty, and perform any calculations in ordinary code. For a PDF, rendering
pages to images or extracting text first is an application design inference,
not a claim of native PDF support. Evaluate missing fields, unreadable images,
nulls and incorrect values on representative documents before relying on the
output. No pay-stub performance or deployment result was established in this
commute. Conversational pricing and format claims were checked against the
official documentation above rather than copied as facts.

## Source Notes

<!-- source-item-id: 20261020-tldr-ai:ai-003 -->

TLDR AI, October 20, 2026, item `ai-003`, position 4. The October 23 morning
bundle contains the explicit save and its questions, conclusions and requested
emphasis. The original announcement and three official documentation pages were
read during intake; announcement claims, current documentation and commute
synthesis are distinguished above.

## Related

- {% include wiki-related-link.md slug="structured-decision-models" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
