---
type: concept
title: 'Eval-Driven Development for Agents'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: eval-driven-development-for-agents
created: 2026-11-19
updated: 2026-11-19
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261112-tldr-dev:dev-002","url":"https://www.langchain.com/blog/what-is-eval-driven-development"}]
---

# Eval-Driven Development for Agents

Divya Santhanam outlines an evaluation loop for building agents. Start with
one observable behavior and specify when it should happen, which actions
are prohibited, and which existing behaviors must keep working. Build a
dataset from representative cases and known failures, then compare
experiments on the same examples.

A passing case can hide a regression elsewhere. Run evaluations in CI to
catch regressions and collect production failures as new examples. The
commute discussion verified Santhanam's byline and LangChain as publisher
before requesting the save.

## Sources and related entries

- [Divya Santhanam, What Is Eval-Driven Development?](https://www.langchain.com/blog/what-is-eval-driven-development)
- [Agentic Engineering Maturity](agentic-engineering-maturity.md)
