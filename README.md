# llm-wiki

Personal LLM knowledge base and TLDR ingestion pipeline.

This repository is the implementation repo. The planning contract is contained
inside this repo under OpenSpec.

## Current Status

Phase 0 is in progress:

- OpenSpec has been initialized for Codex, GitHub Copilot, and Claude Code.
- The first OpenSpec change is `bootstrap-llm-wiki-mvp`.
- The TypeScript/Node runtime skeleton is initialized with focused parser-output
  contract, classifier-validation, and routing tests.
- End-to-end TLDR ingestion, live LLM classification, queue generation, feedback
  handling, and wiki compilation are not implemented yet.

## Development

Use Node 24 with npm 11. The runtime decision is recorded in `docs/runtime.md`,
`.nvmrc`, `.node-version`, and `package.json`.

Project tooling should borrow practical conventions from the local sibling repos
`../bradbalfour-dot-com` and `../bradbalfour-photography` where they fit this
Node/TLDR project. Avoid copying frontend-, Astro-, Playwright-, Cloudflare-, or
browser-specific configuration unless a later OpenSpec change introduces that
surface area.

Common checks:

```bash
npm run ci:install
npm run check
openspec validate bootstrap-llm-wiki-mvp --type change --strict
```

## MVP Direction

The MVP is TLDR-only:

1. Discover daily TLDR emails through a manual Gmail connector workflow, with a
   text-file fallback.
2. Extract non-sponsor editorial items.
3. Classify each item with a source-neutral two-axis classifier.
4. Derive commute, wiki, stream-log, and review behavior in application code.
5. Generate a prepared commute queue.
6. Capture Brad's corrections as feedback labels.
7. Compile approved source material into OKF-style markdown wiki entries.
8. Publish the readable wiki through GitHub Pages first.

Cloudflare Workers, RSS, YouTube, custom realtime voice, and a review/admin UI
are deferred until the TLDR loop proves useful.

## Planning

Primary planning artifacts live under:

```text
openspec/changes/bootstrap-llm-wiki-mvp/
```

Use OpenSpec artifacts as the implementation contract. The parent exploration
archive that seeded this repo is intentionally not required to understand or
contribute to the implementation.
