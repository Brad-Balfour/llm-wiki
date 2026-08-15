---
type: concept
title: 'Wide Exploration, Narrow Delivery'
# prettier-ignore
aliases: ["Build Wide, Ship Narrow","Late PR decomposition"]
# prettier-ignore
tags: ["ai-engineering","software-design","code-review","git","workflow-automation","refactoring"]
wiki_slug: wide-exploration-narrow-delivery
created: 2026-08-14
updated: 2026-08-14
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"19ffad638bac0403-05","url":"https://adapt.com/blog/build-wide-ship-narrow?utm_source=tldrdev"}]
---

# Wide Exploration, Narrow Delivery

AI-assisted development can defer pull-request boundaries until working code
reveals the real dependencies, while preserving design review, product
validation, and small reviewable changes.

## Key Ideas

- Decide what to build before coding, but decide how to divide implementation
  pull requests after the working shape is visible.
- Treat the wide implementation branch as disposable exploration, not a large
  branch to merge as-is.
- Demo the working behavior before code review so product mistakes are found
  before reviewers spend time on implementation details.
- Recut the result into independently useful branches from `main`; stack only
  where a dependency is real.
- Delete the replaced path in a final focused pull request after the new path is
  live, keeping review and rollback boundaries clear.

## Design First, Decomposition Later

Late decomposition is not an excuse to skip planning. The source's workflow
starts by interrogating the plan until important behavior, failure handling,
and trust boundaries are explicit. Novel work can begin with a committed design
document that the team reviews before implementation.

What is deferred is the issue or pull-request split. Up-front decomposition
asks engineers to predict separability at the point of least knowledge. A
working end-to-end implementation supplies better evidence about which changes
are siblings, which truly depend on one another, and where architectural risk
is concentrated.

## The Wide Branch Is Scratch Paper

The exploration branch crosses whatever files and layers are necessary to make
the feature work. Its commits are recovery points for the builder, not a
reviewer-facing narrative. Before review, the implementation is split into a
fresh set of branches from `main`, with stacking reserved for genuine
dependencies.

This is not “build a mess, merge it, then clean it up.” The wide branch never
lands as-is. Reviewers receive narrow diffs that can be understood, merged, and
reverted independently. The split is also when the author reads and takes
ownership of AI-written code rather than treating successful generation as
understanding.

The source provides a reusable decomposition prompt and workflow shape, but not
an exact Git command recipe. It explicitly avoids manual cherry-picking; the
important contract is the resulting branch topology and review safety, not a
particular sequence of commands.

## Why Cleanup Is a Final Pull Request

“Cleanup” means removing the old code path after its replacement is already in
place. Mixing deletion into the change that creates the new path makes the diff
harder to understand and makes rollback ambiguous. A pure-deletion final pull
request gives reviewers one question to answer: is every removed path now
truly obsolete?

This pattern is particularly useful for refactors and multi-surface features
whose final shape is hard to predict. It is less useful when production schema
migrations impose a real sequence, when there is one obvious cut, or when no
part can deliver value independently.

## Costs and Limits

Narrow review does not guarantee incremental delivery. Several clean pull
requests can still sit open and ship together. A dependent stack also incurs
rebasing work when a lower change receives feedback. AI makes branch
decomposition cheaper; it does not make product judgment, architectural review,
or team throughput free.

The article is one practitioner's reported workflow rather than comparative
evidence across teams. Its durable contribution is the separation of three
shapes that are often conflated: wide exploration for learning, a working demo
for product validation, and narrow delivery for review and rollback.

## Source Notes

### [Build Wide, Ship Narrow](https://adapt.com/blog/build-wide-ship-narrow?utm_source=tldrdev)

<!-- source-item-id: 19ffad638bac0403-05 -->

TLDR Dev, 2026-08-13.

Bruno Quaresma describes using a disposable end-to-end branch, validating the
working behavior, and then splitting it into reviewable pull requests. The
commute discussion clarified the brownfield/refactor context, the absence of a
step-by-step Git recipe, real-dependency stacking, and cleanup as deletion of
the replaced path—not cleanup of code that was knowingly merged in a mess.

## Related

- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="code-structure-agent-context-economics" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
