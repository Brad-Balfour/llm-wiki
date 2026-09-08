---
type: concept
title: 'Opinionated End-to-End Test APIs'
# prettier-ignore
aliases: ["How We Raised Mobile End-to-End Test Stability to 98%","Guardrails for reliable end-to-end tests"]
# prettier-ignore
tags: ["software-testing","end-to-end-testing","developer-tools","mobile","ai-agents"]
wiki_slug: opinionated-e2e-test-apis
created: 2026-09-08
updated: 2026-09-08
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"1a07b99332bc6b1f-02","url":"https://shopify.engineering/mobile-e2e-testing"}]
---

# Opinionated End-to-End Test APIs

Reliable end-to-end testing depends as much on the API's permitted behavior as
on the underlying driver. A narrow test language can make synchronization,
user-visible assertions, and diagnosable failures the default while making
fragile shortcuts conspicuous.

## Key Ideas

- Couple every action with an expected visible state. A failure then points to
  the step where behavior diverged instead of surfacing several actions later.
- Keep the safe vocabulary small and reusable. Mark necessary escape hatches
  as unsafe so their use is obvious in review rather than silently becoming the
  easiest path.
- Admit tests to blocking CI only after repeated runs establish stability.
- Prefer selectors and diagnostics that reflect what a user can see. Shopify's
  mobile framework uses OCR and icon matching, while browser applications can
  often get the same benefit from role-, label-, and text-based selectors.
- A constrained, predictable grammar also makes tests easier for coding agents
  to author because the framework carries the team's testing rules.

## Applying the Pattern to Web Frontends

The source describes Shopify's native React Native applications driven through
Appium, not a React website. Its computer-vision implementation therefore does
not transfer directly to every browser suite: mature browser tools already
expose accessibility roles, labels, and other user-facing locators.

The more general lesson does transfer. A web test wrapper can require an
observable postcondition after each navigation or mutation, centralize waiting,
provide named sequences for common flows, flag raw sleeps and implementation-
detail selectors, capture traces or video, and run a new test repeatedly before
it becomes merge-blocking. This is a synthesis from the commute discussion and
the source's framework design, not a claim that Shopify uses this exact browser
architecture.

## Source Notes

### [How we raised mobile end-to-end test stability to 98%](https://shopify.engineering/mobile-e2e-testing)

<!-- source-item-id: 1a07b99332bc6b1f-02 -->

Michael Garfinkle, 2026-08-12. Shopify reports raising individual mobile E2E
test stability from 50% to 98% by replacing direct low-level Appium use with a
builder-style API, visual targeting, failure video, and a pre-promotion
flakiness gate. The reported result is evidence from Shopify's largest mobile
app, not a general benchmark for all test suites.

## Related

- {% include wiki-related-link.md slug="frontend-soak-testing" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="interface-design-rules" %}
