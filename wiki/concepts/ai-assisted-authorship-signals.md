---
type: concept
title: 'AI-Assisted Authorship Signals'
# prettier-ignore
aliases: ["The load-bearing vocabulary of Claude","Linguistic signatures of AI-assisted code"]
# prettier-ignore
tags: ["ai-assisted-development","authorship","linguistics","github","measurement","provenance"]
wiki_slug: ai-assisted-authorship-signals
created: 2026-08-28
updated: 2026-08-28
confidence: low
# prettier-ignore
provenance: [{"source_item_id":"1a0481667cc8198e-12","url":"https://louisabraham.github.io/load-bearing/"}]
---

# AI-Assisted Authorship Signals

Large text corpora can reveal writing styles that rise alongside AI coding
tools, but a linguistic cluster is evidence of a shared style—not proof that a
particular model authored a particular pull request.

## Key Ideas

- Distributional clustering can find vocabulary patterns without pre-labeling
  documents as human- or machine-written.
- A rapidly growing cluster is a population-level signal, not an authorship
  detector for individual documents.
- Sampling rules, account filters, vocabulary thresholds, cluster count, and
  random initialization materially affect the result.
- Public measurements can change as the corpus and analysis are updated, so
  claims need an access date and methodology context.

## What the Analysis Measures

Louis Abraham clusters 461,121 GitHub pull-request descriptions by language
use. The current project page groups them into ten styles and reports that one
cluster grew from 0.7% of the corpus at the start of 2025 to 39% by mid-2026.
Its characteristic vocabulary includes formulations such as “load-bearing,”
“delve,” “tapestry,” and repeated structural or explanatory phrases associated
in public discourse with Claude-like prose.

The analysis uses hard KL/Bregman k-means over word distributions. Its corpus
samples ten five-minute windows per day, truncates each search window to the
first 100 results, limits any author to three descriptions per week, and admits
a vocabulary term only after use by 50 distinct accounts. The author explicitly
notes that `K = 10` was chosen after inspecting outcomes and that random seed
choice matters.

## Interpretation Boundary

The commute discussion initially referenced a 45% figure. The living source
retrieved on 2026-08-28 reports 39% for the growing cluster; 45% appears on the
same page as the share of search results excluded by empty-body and bot-account
filters. The source continues to collect and recompute data, so the current
number should not be treated as an immutable historical statistic.

Bot-like accounts are removed, but a remaining account being labeled or
treated as human does not prove its text was written without assistance. The
result is best read as evidence that an identifiable style spread rapidly in
GitHub prose during the rise of coding agents. It does not uniquely identify
Claude, distinguish model families or versions, or establish the fraction of
pull requests authored by AI.

## Source Notes

### [The load-bearing vocabulary of Claude](https://louisabraham.github.io/load-bearing/)

<!-- source-item-id: 1a0481667cc8198e-12 -->

Louis Abraham, living analysis accessed 2026-08-28. Publishes the collection,
sampling, clustering, vocabulary-scoring methodology, parameters, limitations,
and an evolving visualization of GitHub pull-request language.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="multiagent-systemic-risk" %}
