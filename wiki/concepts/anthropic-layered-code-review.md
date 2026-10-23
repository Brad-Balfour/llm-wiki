---
type: concept
title: 'Anthropic’s Layered Code Review'
# prettier-ignore
aliases: ["How the Claude Code team does code review"]
# prettier-ignore
tags: ["ai-agents","code-review","verification","risk-management","software-design"]
wiki_slug: anthropic-layered-code-review
created: 2026-10-22
updated: 2026-10-22
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261019-tldr-ai:ai-012","url":"https://claude.dev/blog/solving-code-review-at-anthropic/"}]
---

# Anthropic’s Layered Code Review

Anthropic describes code review as a system of verification, automated review,
human judgment and controlled release. The useful unit is the whole change
lifecycle, rather than whether somebody manually read every line.

## What the Source Establishes

Addy Osmani, Morgan Westlee Lunt and Qing Wang's October 15, 2026
[engineering account](https://claude.dev/blog/solving-code-review-at-anthropic/)
describes author-side tests, builds and fresh-context agent checks before a PR;
automated review on every PR; security findings that block until fixed or
explicitly resolved; and blocking conventional CI. Optional specialist skills
and individual author practices do not establish a fixed per-commit cadence.

Risk tiers require zero, one or two human approvals. Additional classification,
sensitive-path rules and trusted-author restrictions can demand another person.
Agent approvals do not count as human approvals, and approval applies to a
particular code revision. Merge queues check the integrated result; flags,
employee exposure and staged releases constrain deployment consequences.

The team evaluates reviewers against incident-causing changes and known-clean
PRs. It tracks human approvals, comments and waiting alongside reverts and
incidents. These indicators do not establish a total-human-hours formula.
The account describes a PR exceeding fifty review rounds and says roughly 59%
of repeatedly flagged code already existed at first review. After three rounds,
reconsider the approach; this is not a universal three-round hard stop.

## October 21 Commute Discussion

Brad explicitly saved the article with the detailed back-and-forth. The following
questions and interpretations preserve that discussion; they are not additional
measured results from Anthropic.

### Verification Cadence and Human Attention

Separate author-led proof before opening a PR from the review triggered by the
PR and renewed checks after fixes. A change can originate on a laptop or through
an agent session and still pass common merge gates. Different engineers steering
agents differently within those gates does not imply unrelated team processes.
The discussion did not establish that review runs automatically after every
local commit or continuously over every file.

Runnable commands, tests, builds, screenshots and simulations provide evidence
that can be inspected independently. Fresh-context reviewers and optional
bug-finding, simplification or design skills supplement that evidence. Recurring
findings can become concise project/reviewer instructions or deterministic lint
rules. Repeating the same review comment is an expensive substitute for learning.
The article attributes a two-to-threefold improvement estimate to Boris Cherny;
this is an attributed estimate, not a general performance guarantee.

Brad asked whether fewer reviewers save total engineering time or move work into
debugging and incident response. Approvals per PR, median/p95 approvals, comments
and waiting measure parts of attention; they omit some downstream effort. The reported rise
in substantive comments from 16% to 54% measures activity, not precision or defects prevented.
Review cost and depth belong beside quality outcomes when comparing systems.
See {% include wiki-related-link.md slug="agent-work-metrics" %}.

### Approval Semantics and Risk

Zero required human approvals can permit a low-risk change to merge without a
person manually looking at its PR, provided all other gates pass. One human may
be the directing author; a two-human requirement adds another person. This does
not imply that an agent chooses its own authority or that the author must reread
every line. Sensitive paths and additional-person rules still matter: a CI change
requiring a person does not automatically mean every CI change requires two.

Brad pressed for the risk classifier's actual definition, thresholds and
validation. The discussion did not establish a likelihood-times-consequence
formula or evidence that classification is accurate enough for every zero-human
merge. Security findings can be fixed or resolved with reasons; a blocking gate
is not an obligation to implement every suggestion. Approval tied to a revision
can need renewal after changes. Deterministic CI remains necessary after AI review.

### Evaluate the Reviewer and Bound Its Loops

Daily evaluations using historical incident/revert examples and their fixes can form a regression set
with engineer-confirmed defects and locations. Evaluating the complete review
system is different from retraining its underlying model. Finding dispositions
such as fixed, wrong, intentional or not worth fixing are useful but imperfect
truth labels; clean-PR checks help detect harmful overcalling.

An author and reviewer can work asynchronously yet waste an entire night repairing
or rediscovering findings. The discussion contrasted locally thorough review with
overall throughput: false positives can induce real, unnecessary changes. Narrow
later rounds to changed code, group related bug classes and avoid repeat comments.
The reported 59% is not a false-positive rate or evidence that fixes introduced
all later bugs. The source's three-round reassessment is an orchestration control,
not proof of an optimal universal limit. Nightly scans were discussed, but their
coverage and frequency across files were not established in the commute.

### Impact, Reversibility and Architectural Precedent

Brad proposed treating impact/blast radius and reversibility as distinct
properties. Security and money are examples of consequence, not its full extent.
A flag or revert can stop operational behavior while copied architecture,
corrupted data or organizational precedent survives. A small diff can therefore
create long-lived consequences. Do not infer that Anthropic's classifier models
these dimensions independently.

The earlier exact two-axis source already preserved in this wiki is PostHog's
reviewability/reversibility matrix in
{% include wiki-related-link.md slug="agent-autonomy-boundaries" %}.
It is a useful connection, but the artifact does not establish that this was the
particular Software Factory article Brad remembered from the prior week.
Reviewability/reversibility and impact/reversibility are related, distinct models.
That remembered article's identity remains unresolved rather than guessed.

Merge queues catch interactions with other changes. Flags, staged exposure,
telemetry, on-call ownership and fast rollback constrain damage and detect escaped
defects; they cannot erase every consequence. The source acknowledges missing
automatic circuit breakers that tighten approval policy as incident trends worsen.
Changing direction quickly can stop a mistaken feature without undoing all
architectural drift.

### Human Judgment, Learning and Accountability

The discussion retained five human responsibilities: decide whether the change
should exist; scrutinize intrinsically consequential code; assess architecture
that other people and agents may copy; judge evidence and its limits; and remain
accountable for the outcome. Working code alone does not establish worthwhile
scope. An agent saying that checks passed does not substitute for inspectable
verification evidence.

Reducing peer review also removes incidental knowledge transfer. Targeted module
explanations, interactive visualizations and visible shared work can help others
learn or join in. They do not establish a complete replacement for a team's
shared architectural understanding. Small independent PRs, reversible releases,
scrutiny proportional to blast radius and fast feedback support ownership by the
person closest to the change without proving a blame-free culture.

Brad compared this ownership norm with Jerry Weinberg's egoless programming in
_The Psychology of Computer Programming_. Preserve it as a comparison: blameless
collaboration overlaps, while reduced peer review and named author responsibility
can pull differently from collective learning and reduced attachment to code.
Neither equivalence nor the organization's actual psychology follows from a
single cultural principle. The commute's pronunciation correction was “egoless.”

## Provenance and Open Questions

The bundle reconstructs the multi-day discussion rather than preserving a
verbatim transcript. Its source-section and paragraph counts were inconsistent;
they are not reproduced as verified structure. The source was independently read
for this note. The detailed discussion above retains distinctions and open
questions without promoting every spoken source summary to fact.

Article 6 was the explicit save. Article 7 appeared in the sweep but was not
subsequently played in the resumed detailed sequence before the commute ended.
The request to continue to article 7 does not establish that it was read.

## Related

- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="human-understanding-in-agentic-coding" %}
- {% include wiki-related-link.md slug="agent-work-metrics" %}

<!-- source-item-id: 20261019-tldr-ai:ai-012 -->
