---
type: tool
title: 'TypeScript 7'
# prettier-ignore
aliases: ["TypeScript native port","TypeScript 7.0"]
# prettier-ignore
tags: ["typescript","javascript","compiler","go","language-server","performance","tooling"]
wiki_slug: typescript
created: 2026-08-24
updated: 2026-08-24
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"url_47fcec638d2ad5ff","url":"https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/"}]
---

# TypeScript 7

TypeScript 7 is the native Go port of the TypeScript compiler and language server, designed for substantially faster builds, diagnostics, and editor feedback on large codebases.

## Key Ideas

- Microsoft reports typical full-build speedups of roughly 8–12x in its published project sample, with workload-dependent memory reductions.
- Parallel parsing, type-checking, emitting, and project builds tighten both developer and coding-agent feedback loops.
- Version 7.0 intentionally has no public compiler API; tools that require the TypeScript API may need the TypeScript 6 compatibility package side by side.
- The release adopts TypeScript 6's stricter defaults and removal of deprecated options, so migration is not only a performance upgrade.
- Worker counts trade CPU time against memory and can expose rare ordering issues; teams should pin and test settings across local and CI environments.

Published benchmarks and customer reports demonstrate the potential upper range, not a guarantee for every repository. A safe adoption measures build, editor, CI, memory, plugin, and API compatibility on the target codebase.

## Source Notes

### [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

<!-- source-item-id: url_47fcec638d2ad5ff -->

Microsoft TypeScript, 2026-07-08. Official release post for the native port, benchmark results, compatibility path, parallel controls, and changed defaults.

## Related

- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="code-structure-agent-context-economics" %}
