# Runtime

Decision date: 2026-07-06

The MVP runtime target is Node 24 with npm 11. The local Phase 0 runtime check
for this implementation pass used Node `v24.10.0` and npm `11.6.1`.

Node 26 is not promoted for this change. Promotion requires an OpenSpec design
update plus matching changes to `package.json`, `.nvmrc`, `.node-version`, and
CI/runtime documentation.

## Local Conventions

When adding or changing project tooling, prefer applicable patterns from the
local sibling repos:

- `../bradbalfour-dot-com`
- `../bradbalfour-photography`

Reusable patterns include npm script naming, TypeScript strictness, ESLint flat
config structure, Prettier style, and ignore-file hygiene. Do not copy
frontend-, Astro-, browser-, Playwright-, Cloudflare-, image-pipeline-, or
deployment-specific configuration unless a later OpenSpec change makes that
surface area part of `llm-wiki`.
