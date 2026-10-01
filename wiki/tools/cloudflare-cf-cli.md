---
type: tool
title: 'Cloudflare cf CLI'
aliases: ['cf']
tags: ['cloudflare', 'deployment', 'agents', 'vite', 'migration']
wiki_slug: cloudflare-cf-cli
created: 2026-09-30
updated: 2026-09-30
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20260929-tldr-dev:dev-006","url":"https://blog.cloudflare.com/cloudflare-cf-cli-launch/"}]
---

# Cloudflare cf CLI

Cloudflare's `cf` CLI brings its API and Workers development commands into one
interface designed for both developers and agents. Its September 2026 launch
is an open beta.

## Published Migration Path

The announcement identifies Vite as the default build path. For existing Vite
Workers, `cf migrate` converts configuration to `cloudflare.config.ts`.
For JavaScript projects that depend on Wrangler's esbuild pipeline, and for Rust
or Python Workers, `cf` still delegates development and deployment to Wrangler.
Using the new command therefore does not necessarily replace the build system.

Cloudflare plans one final major Wrangler release after the beta ends, followed
by 18 months of maintenance. The announcement gives no beta-end date, so that
support window is a future sequence rather than a calendar deadline.

The configuration model also changes: Vite modes and programmatic factories
represent environments; `worker.env` contains typed bindings; and `triggers`
groups fetch routes, schedules, queues, and email. Configuration begins with
Workers; policies, zones, and DNS are described as future work. Static sites can
start without a configuration file.

## Commute Discussion and Evaluation Plan

The September 30 discussion treated adoption as a separate evaluation for each
website repository. This is planning synthesis, not evidence that either site
is ready to migrate or that migration is urgent.

For each site, first identify its current build path, Wrangler configuration,
deployment commands, environments, bindings, and triggers. Establish whether
`cf migrate` produces a Vite configuration or retains Wrangler delegation.
Compare the proposed configuration's behavior with the current deployment before
estimating effort. A static-only site may have less configuration to translate,
but its actual asset routing and release process still need verification.

Keep the two repository evaluations independent: build a preview, check route
and environment parity, identify CI changes, and preserve a working rollback.
The discussion explicitly requested one issue in each website repository,
without a migration issue in `llm-wiki`:

- [Personal website evaluation, issue #75](https://github.com/Brad-Balfour/bradbalfour-dot-com/issues/75).
- [Photography website evaluation, issue #29](https://github.com/Brad-Balfour/bradbalfour-photography/issues/29).

Both sites currently build static Astro output and deploy it through Cloudflare
Pages with Functions. Their evaluations must establish support for that exact
architecture before applying Workers migration instructions. The photography
evaluation also preserves its image-generation and R2 upload pipeline; the
personal-site evaluation includes its separate redirect deployment. These are
repository findings and requested checks, not results of a completed migration.

## Source Notes

### [Introducing cf: the Agentic CLI for the Entire Cloudflare API](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)

<!-- source-item-id: 20260929-tldr-dev:dev-006 -->

TLDR Dev, September 29, 2026, item `dev-006`. The exact public announcement was
read directly during September 30 intake. The bundle's explicit save includes
the request to retain the migration discussion and create two separate website
evaluation issues. Source facts and that planning context are distinguished above.

## Related

- {% include wiki-related-link.md slug="agent-tool-boundaries" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
