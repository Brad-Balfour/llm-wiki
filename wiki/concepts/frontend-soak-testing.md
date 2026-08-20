---
type: concept
title: 'Frontend Soak Testing'
# prettier-ignore
aliases: ["Your SPA Is Leaking Memory. Soak Test It","SPA memory leak testing","Playwright soak testing"]
# prettier-ignore
tags: ["frontend","testing","performance","memory-leaks","playwright","react","single-page-applications"]
wiki_slug: frontend-soak-testing
created: 2026-08-19
updated: 2026-08-19
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"1a019d3993e53b2a-02","url":"https://denodell.com/blog/your-spa-is-leaking-memory-soak-test-it?utm_source=tldrdev"}]
---

# Frontend Soak Testing

A frontend soak test repeats a realistic round-trip user flow in one long-lived
browser context and checks whether retained DOM nodes or event listeners keep
growing. It adapts a familiar backend durability test to single-page and
Electron applications whose process may remain alive for hours.

## Key Ideas

- Ordinary end-to-end tests create clean browser contexts and finish too
  quickly to expose small leaks that accumulate during real use.
- A useful soak flow returns to its starting state, such as opening and closing
  a drawer or applying and clearing a filter.
- DOM-node and listener counts are more stable assertions than JavaScript heap
  size, which can move substantially between healthy runs.
- Warmup passes separate one-time lazy loading and cache growth from repeated
  retention.
- Faked clocks and mocked network responses compress hours of timers and
  polling into a short deterministic run.
- Heap snapshots remain a diagnosis tool after the automated test establishes
  that growth is real.

## A Playwright Test Shape

The source's Playwright approach runs a few hundred passes in the same Chromium
context. It uses the Chrome DevTools Protocol to collect garbage and read heap,
DOM-node, and JavaScript-listener metrics. Assertions focus on listeners that
should return to baseline and on a small fixed allowance for node-count jitter.

The flow must be intentionally cyclic. An infinite feed or a chat that retains
messages is expected to finish heavier than it began, so simple before-and-after
growth is not evidence of a leak there. For a drawer, modal, route transition,
or filter that should fully unwind, a steady positive slope is meaningful.

This belongs in a nightly or scheduled performance suite rather than every
pull request. Repeated measurements are noisy, and the test is designed to
cover far more lifecycle time than a fast correctness suite. Once it fails, a
Chrome heap snapshot filtered for detached nodes can reveal the listener,
timer, subscription, or variable still retaining removed DOM.

## React Development Connection

React does not make lifecycle ownership disappear. Effects that register
listeners, timers, subscriptions, observers, or external resources still need
cleanup when their owning component unmounts or re-runs the effect. A soak test
checks the system-level consequence of those local ownership decisions: after
the same component flow mounts and unmounts repeatedly, retained resources
should stabilize.

That makes soak testing complementary to component and end-to-end tests:

- component tests verify a cleanup path in isolation;
- end-to-end tests verify that a user flow works once; and
- soak tests verify that the same working flow remains healthy after many
  lifecycle repetitions.

Faking the browser clock is especially important for React applications with
polling or delayed cleanup. The test must also return realistic mocked payloads;
a tiny response can hide retention that becomes material with production-sized
data.

## Limits

The article reports that a static scan of 500 popular React, Vue, and Angular
repositories found uncleaned listeners, timers, or subscriptions in 86% of
them. That scan motivates testing but does not prove that 86% of deployed SPAs
have user-visible memory failures. CDP-based measurement also makes the
described implementation Chromium-specific, and thresholds require calibration
for each application's legitimate retained state.

## Source Notes

### [Your SPA Is Leaking Memory. Soak Test It](https://denodell.com/blog/your-spa-is-leaking-memory-soak-test-it?utm_source=tldrdev)

<!-- source-item-id: 1a019d3993e53b2a-02 -->

TLDR Dev, 2026-08-19.

Den Odell presents the repeated-flow method, CDP measurements, clock and network
control, nightly-test guidance, and the `playwright-soak-test` fixture. The
React lifecycle relationship above applies the source's framework examples to
resource ownership; it is synthesis rather than a React-specific benchmark.

## Related

- {% include wiki-related-link.md slug="state-ownership-before-state-management" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
