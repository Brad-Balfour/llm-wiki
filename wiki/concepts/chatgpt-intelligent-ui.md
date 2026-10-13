---
type: concept
title: 'ChatGPT Intelligent UI'
# prettier-ignore
aliases: ["DIL UI compilation"]
# prettier-ignore
tags: ["generative-ui", "agent-ui", "compilers", "streaming", "interaction-design"]
wiki_slug: chatgpt-intelligent-ui
created: 2026-10-12
updated: 2026-10-12
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261009-tldr-dev:dev-001","url":"https://www.openui.com/blog/how-chatgpt-intelligent-ui-works"}]
---

# ChatGPT Intelligent UI

## Source Architecture

Thesys Engineering Team's October 8 [reverse-engineering account](https://www.openui.com/blog/how-chatgpt-intelligent-ui-works) examines web behavior; mobile was unexamined. It is third-party evidence, not official OpenAI documentation. The article does not expand DIL's name.

| Stage              | Reported responsibility                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Inference          | DIL mixes Markdown, component syntax, JavaScript and interpolation; it supports conditional branches and list iteration. |
| Server compilation | Produces JavaScript and JSON, repairs unfinished constructs, checks properties, extracts constants and keys state.       |
| Client execution   | A sandboxed iframe starts a restricted worker; it retains state, compares trees and emits changes.                       |
| Rendering/catalog  | ChatGPT renders catalog components; server-resolved data and bound tool fields are separate inputs.                      |
| Streaming          | SSE replaces programs or changes constants/data; recompilation preserves keyed state.                                    |
| Actions/app cards  | GenUI supports new-turn, copy, URL and entity actions. AppBlock uses Skybridge iframe HTML/CSS/JavaScript.               |

Fallback loses computed/iterated output. Observed limitations include resets, hidden state, follow-up regeneration and silent failures. Evidence combines exports, streams, public bundles, browser inspection, probes and compiler reproduction.

## October 12 Commute Discussion

Brad explicitly saved the article and its architectural back-and-forth from the October 9 Dev queue. The recovered capture asks:

- What does DIL mean, and why invent a declarative syntax instead of using React/JSX?
- How do conditions and iteration work?
- Which responsibilities belong to inference, compilation, runtime and rendering?
- How do the design system, streaming, actions and app cards fit together?
- What do fallback behavior, rough edges and methodology establish?

The save requests technical subsection detail and a clear publisher distinction. Playback incorrectly attributed the article to OpenAI; the canonical URL and source identify OpenUI/Thesys. Audio interruptions prompted repetitions, and Brad corrected an answer that repeated old takeaways instead of identifying unmentioned substance.

These are reconstructed discussion questions and preferences, not verbatim complete dialogue. The bundle declares omitted transcript spans; the supplied share returned cache misses on the website read and one retry. The source outline above answers the recoverable architectural questions while leaving DIL's expansion and omitted dialogue unasserted.

## Source Notes

### [How ChatGPT Intelligent UI works](https://www.openui.com/blog/how-chatgpt-intelligent-ui-works)

<!-- source-item-id: 20261009-tldr-dev:dev-001 -->

October 9 TLDR Dev, position 3; explicit October 12 save with discussion context. Third-party observations need independent confirmation before becoming implementation or security guarantees.

## Related

- {% include wiki-related-link.md slug="copilotkit" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
