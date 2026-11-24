---
type: tool
title: 'Modern Web Guidance'
aliases: []
tags: ['ai-agents', 'developer-tools']
wiki_slug: modern-web-guidance
created: 2026-11-18
updated: 2026-11-23
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261111-tldr:general-006","url":"https://developer.chrome.com/blog/modern-web-guidance-v1"},{"source_item_id":"20261118-tldr-dev:dev-012","url":"https://developer.chrome.com/blog/modern-web-guidance-v1"}]
---

# Modern Web Guidance

[Philip Walton's Chrome for Developers announcement](https://developer.chrome.com/blog/modern-web-guidance-v1)
describes Modern Web Guidance 1.0, a set of coding-agent skills that combine
expert-reviewed web guidance with Baseline and browser compatibility data.
Firefox and Edge joined Chrome in the effort. The guides cover practical gaps
such as keyboard focus, reduced motion, usable validation, rendering
performance and safe HTML handling.

The first modernization workflow scans existing HTML, CSS, JavaScript and
package metadata for a limited set of known patterns. A recommendation
depends on the project's browser support requirements. For example, native
dialog, scrolling or transition features may remove custom JavaScript where
the support target allows them. Chrome publishes guide evaluations and
describes separate runtime checks with Chrome DevTools for agents.

## Discussion

The commute explicitly saved this guidance after the prepared item
announcement. A useful application is to combine compatibility-aware advice
with browser verification on the actual codebase. A guide can suggest what
to change. Keyboard testing or a performance trace can verify what changed
for users.

The November 23 Dev commute saved the same release from a second edition and
asked to retain the original article as the authority. The release adds
accessibility review with assistive technology and public evaluations for
each guide. Those evaluations measure the guidance under test conditions.
Browser checks on the project still establish whether the change works for
its users.

<!-- source-item-id: 20261111-tldr:general-006 -->
<!-- source-item-id: 20261118-tldr-dev:dev-012 -->
