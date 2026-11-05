---
type: concept
title: 'Agent-Assisted Software Ambition and Verification'
# prettier-ignore
aliases: ["We should be more ambitious with the software we build"]
# prettier-ignore
tags: ["ai-agents","software-engineering","testing","verification"]
wiki_slug: agent-assisted-software-ambition
created: 2026-11-04
updated: 2026-11-04
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261026-tldr:general-006","url":"https://danluu.com/ambitious/"}]
---

# Agent-Assisted Software Ambition and Verification

[Dan Luu](https://danluu.com/ambitious/) argues that coding agents change the cost of projects enough to reconsider work previously dismissed as impractical. A personal tool can meet a "works for me" bar without meeting the much higher bar for a maintained product. The claimed speedups in his post are personal observations, not controlled benchmarks.

## Build more, but make correctness observable

Luu points to Michael Malis's pgrust work: testing the rewrite uncovered real PostgreSQL bugs, providing value even if the rewrite itself never succeeds. He also describes tailored tools for his own development bottlenecks, including a regex engine and a ripgrep fork. Reduced implementation effort can make narrow, bespoke tools worthwhile, while the cost of independent verification and maintenance remains.

His board-game example illustrates the verification gap: when a model claimed to implement a technique incorrectly, he needed enough domain understanding to identify and correct the error. He argues that the gap between what models can implement and verify can grow as the problems undertaken become more ambitious. In the appendix, Yossi Kreinin cautions that poorly understood black boxes, unclear success criteria, overfitted optimizations, and maintenance costs can make greater ambition counterproductive. Luu discusses self-checking approaches and property-based testing as possible responses, not proof that every project is easily verified.

The commute discussion asked whether a project can be valuable even if it does not ship and how engineers can test increasingly large generated systems. Its emphasis on independent checks, property-based tests, and explicit correctness evidence is an application of the article, not a guarantee that formal methods suit every project. See [Human Understanding in Agentic Coding](human-understanding-in-agentic-coding.md).

## Sources

<!-- source-item-id: 20261026-tldr:general-006 -->

- Dan Luu, [We should be more ambitious with the software we build](https://danluu.com/ambitious/).
