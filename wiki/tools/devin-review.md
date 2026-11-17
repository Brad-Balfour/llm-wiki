---
type: tool
title: 'Devin Review 2.0'
aliases: ['Devin Review']
tags: ['ai-agents', 'code-review', 'developer-tools', 'security']
wiki_slug: devin-review
created: 2026-11-16
updated: 2026-11-16
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261106-tldr-ai:ai-016","url":"https://devin.ai/blog/devin-review-2"}]
---

# Devin Review 2.0

[Cognition's announcement](https://devin.ai/blog/devin-review-2) describes an
AI pull-request reviewer that finds potential bugs and provides a guided tour for
human reviewers. Reviews can be requested in GitHub or GitLab, started in Devin,
or triggered automatically with rules for paths, branches, labels and draft
status. Subsequent reviews focus on changes since the previous review; per-PR
spending limits and custom reviewers offer further control. Cognition says Devin
can investigate findings and fix, dismiss or escalate them when used together.

The vendor reports a typical review cost of $0.25–$0.75 and an 82% reduction
since August 2026. These are vendor figures, not independent measurements or a
guarantee for a particular repository. The [pricing page](https://devin.ai/pricing)
currently lists Teams at $80 per month plus $40 per month per full developer
seat; check current plan and usage terms before purchase.

## Discussion and evaluation

The commute discussion considered a hosted, proprietary GitHub integration
rather than running a review engine as a local GitHub Actions job. Verify the
actual integration and deployment options for the intended account before
adoption. The useful comparison is whether review findings justify their cost,
noise and code-access requirements alongside existing human and automated
review, not whether the service can eliminate human judgment.

The discussion specifically asked whether zero data retention applies to
Cognition itself or only to downstream model providers. Devin's
[enterprise security overview](https://app.devin.ai/) describes zero data
retention with model providers; that statement alone does not establish zero
retention by Cognition. Its [security exhibit](https://cognition.com/legal/security)
describes configurations in which customer data may be processed or stored in
Cognition-controlled infrastructure. Confirm product-specific retention,
training settings, deletion, repository permissions and contractual terms before
providing sensitive code.

<!-- source-item-id: 20261106-tldr-ai:ai-016 -->

## Related

- {% include wiki-related-link.md slug="factory-droid-harness" %}
