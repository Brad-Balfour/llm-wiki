---
type: concept
title: 'Agent Memory and Verification'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: agent-memory-and-verification
created: 2026-11-17
updated: 2026-11-17
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261109-tldr-ai:ai-004","url":"https://www.anthropic.com/research/components-of-agent-memory"}]
---

# Agent Memory and Verification

[Anthropic's engineering report](https://www.anthropic.com/research/components-of-agent-memory)
describes selectively retaining task experience and revisiting source
material in a later consolidation pass it calls dreaming. A Pokémon
comparison at roughly 10,000 steps found 413 memory files and one badge for
Sonnet 3.7, and ten files and four badges for Fable 5. These were individual
runs with different models. An offline pass also corrected a mistaken
landmark note that had misdirected the agent.

On a repeated database task, Opus 5 improved its mean reward from 0.564
to 0.828 with persistent memory. It tested hypotheses after mistakes and saved
rules with evidence. In Anthropic’s 25-question evaluation over a 350,000-file
company corpus, a developed wiki plus search scored 61% versus 53% for search
alone. Building the wiki took 128 agent sessions. In a separate contract
evaluation, concurrent writes to one shared table retained 41 of 57 graded
facts. After assigning each source document to one writer and preserving
contract wording, all 57 survived. The change combined ownership and faithful
capture, so it does not isolate either intervention.

## Discussion with Mastra as a comparison

[Mastra Observational Memory](https://mastra.ai/docs/memory/observational-memory)
uses an Observer to turn older messages into dated observations and a
Reflector to condense accumulated observations. Recent messages stay in
context and older history can be represented compactly. Mastra also exposes
working memory and semantic recall. [Knowledge](https://mastra.ai/blog/introducing-knowledge)
adds shared, scoped pages that agents can search, read and update. Mastra's
[LongMemEval results](https://mastra.ai/blog/observational-memory) and
Anthropic's game and document evaluations measure different tasks.

The commute proposed using observations for session continuity and an explicit
verification step to promote selected lessons to a shared knowledge base.
Keep original transcripts and tool results available as evidence. Before
promoting a lesson, check it against the sources, test important hypotheses,
record provenance and uncertainty, and assign write ownership or merge changes
safely. Keep a small index in context and retrieve supporting pages as needed.
A reflection pass can compress observations. A verification pass checks
whether the claim deserves reuse. Track answer quality, token cost and
stale-fact repair when evaluating the combined design.

<!-- source-item-id: 20261109-tldr-ai:ai-004 -->
