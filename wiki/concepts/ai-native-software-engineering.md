---
type: concept
title: 'AI-Native Software Engineering'
# prettier-ignore
aliases: ["Control the ideas, not the code","Engineer away the slop"]
# prettier-ignore
tags: ["ai-engineering","software-design","correctness","code-review","formal-verification","quality-gates"]
permalink: /wiki/ai-native-software-engineering/
created: 2026-07-16
updated: 2026-07-25
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19f6057544b9bae7-06","source_path":"sources/tldr/2026-07-14-ai-native-software-engineering.txt","url":"https://antirez.com/news/169"},{"source_item_id":"general-20260724-05","source_path":"sources/tldr/2026-07-24-engineer-away-the-slop.txt","url":"https://ghuntley.com/slop/"}]
---

# AI-Native Software Engineering

AI-native software engineering shifts the developer's center of gravity from manually producing and inspecting every line of code toward specifying behavior, making design choices, and verifying correctness and performance.

## Key Ideas

- A developer remains accountable for the system's behavior even when an LLM generates much of its code.
- Design constraints, correctness criteria, and performance goals become primary control surfaces.
- Review should focus on evidence that the system meets its intended behavior rather than only line-by-line authorship.

## Verification as a Feedback Loop

Generated code becomes safer when a recurring failure stops being a repeated
review comment and becomes an executable rule. Depending on the invariant, that
rule might be a test, a type constraint, a static analyzer, an
organization-specific AST check, or a pre-commit gate.

- Deterministic checks should own known, repeatable failure patterns.
- Adversarial LLM review can search for unfamiliar failures, but its findings
  should become durable checks when practical.
- Human review should include the quality gates themselves: what they prove,
  what they miss, and whether generated code can evade them.
- Formal methods and deterministic system testing may become easier to apply as
  tooling improves, but availability of tools does not eliminate the need for
  engineering judgment or evidence.

## Source Notes

### [Control the ideas, not the code](https://antirez.com/news/169)

<!-- source-item-id: 19f6057544b9bae7-06 -->

TLDR Dev, 2026-07-14.

### [Engineer away the slop](https://ghuntley.com/slop/)

<!-- source-item-id: general-20260724-05 -->

TLDR, 2026-07-24.

The source argues that formal verification and deterministic testing are
crossing an accessibility threshold. That forecast is directional and should
not be treated as proof that these methods are already routine.

## Related

- [deterministic-agent-workflows]({{ '/wiki/deterministic-agent-workflows/' | relative_url }})
- [review-driven-software-factories]({{ '/wiki/review-driven-software-factories/' | relative_url }})
