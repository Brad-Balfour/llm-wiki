---
type: concept
title: 'Review-Driven Software Factories'
# prettier-ignore
aliases: ["Why Software Factories Fail","Human-in-the-loop software factories","Agentic documentation workflows","Foreman software factory","Hiring Agents Is the Easy Part"]
# prettier-ignore
tags: ["ai-agents","software-design","planning","code-review","context-management","documentation","workflow-automation"]
wiki_slug: review-driven-software-factories
created: 2026-07-25
updated: 2026-08-16
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"dev-20260724-01","url":"https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md"},{"source_item_id":"19fd6c96b2d39a67-11","url":"https://github.blog/ai-and-ml/github-copilot/automating-cross-repo-documentation-with-github-agentic-workflows/?utm_source=tldrdev"},{"source_item_id":"19ffad638bac0403-02","url":"https://blog.cloudflare.com/astro-issue-triage/?utm_source=tldrdev"},{"source_item_id":"19ffffe9eeaeab99-06","url":"https://github.com/vercel-labs/eve-software-factory-template?utm_source=tldrnewsletter"},{"source_item_id":"19ffb53bd896ad92-11","url":"https://x.com/AlanaDLevin/status/2087526319999303784"}]
---

# Review-Driven Software Factories

Reliable AI-assisted software development treats specifications, plans, and review decisions as durable source artifacts while using agents to accelerate bounded implementation work.

## Key Ideas

- Review leverage is highest upstream, before implementation multiplies an incorrect product or architecture decision.
- Plans and specifications preserve intent across context compaction and model handoffs.
- Subagents isolate noisy exploration, but human alignment and accountable review remain necessary.
- The source presents experience-driven practices rather than strongly validated universal rules.

## Operating Model

1. Review the product intent before agents turn it into architecture.
2. Review the architecture before implementation multiplies its assumptions.
3. Keep the accepted specification and plan as source artifacts that survive
   context-window changes.
4. Give implementation agents bounded tasks and compact only after durable
   decisions have been written down.
5. Review for mental alignment with the system's intent, supported by tests and
   targeted code inspection, instead of pretending exhaustive line-by-line
   reading is always possible.

Subagents are useful here as context-isolation boundaries: research, review, and
implementation can happen without filling the main decision context with every
intermediate detail. They do not make accountability or cross-boundary review
optional.

## Documentation as a Review-Driven Propagation Workflow

Documentation drift across repositories is a useful concrete instance of this
operating model. A merged product change can trigger an agent that decides
whether user-facing documentation is needed, drafts the change in the docs
repository, and opens a review request for the engineer who approved the
feature. The agent performs the mechanical propagation; the subject-matter
expert remains accountable for correctness.

The reliable boundary is narrower than “let an agent update documentation”:

- Resolve release branches and other routing metadata deterministically before
  invoking the model.
- Give the agent read access and let it emit structured write intent rather
  than granting it unrestricted repository writes.
- Materialize that intent through scoped tooling with allow-listed repositories,
  branches, labels, and protected files.
- Keep generated documentation pull requests as drafts and assign the engineer
  who reviewed the product change as the documentation reviewer.
- Teach the docs-worthiness gate with negative examples such as CI-only,
  tests-only, dependency, logging, and internal-refactor changes.
- Fall back to a visible issue when the write path fails so work is not silently
  lost.

GitHub reports that the Aspire team ran this check on 396 merged product pull
requests during a 30-day window. The workflow created 82 documentation pull
requests, all of which merged, with a reported median merge time of 44.8 hours.
Those results are one team's operational evidence, not a general benchmark, but
they demonstrate an important shape: frequent automated judgment can coexist
with sparse writes, constrained authority, and human approval.

## Issue Triage as a Durable State Machine

Astro's automated issue-triage pipeline is a more ambitious instance of the
same review-driven pattern. Cloudflare reports that it reduced Astro's open
issue count from more than 200 to about 30 by automating the work between a bug
report and a reviewable fix—not by auto-closing old reports.

The triage skill mirrors four maintainer stages: reproduce, diagnose, verify,
and fix. Each stage runs in an isolated subagent and passes a `report.md`
forward, which makes the handoff explicit and limits the tendency to force a
solution before establishing that a bug exists. GitHub issue labels provide the
state machine, while issue comments hold the durable history. When the agents
find a fix, the workflow publishes a preview for the original reporter; a pull
request is opened only after the reporter confirms the patch.

This design separates three responsibilities that are easy to blur:

- GitHub Actions is the reproducible execution harness and permission boundary.
- The triage skill defines the domain procedure and isolated handoffs.
- Flue is the platform-neutral agent runtime beneath the workflow.

The source says the same event-to-workflow shape could begin with Slack, a cron
job, or a webhook. The commute discussion extended that into possible Jira,
Datadog, Rollbar, Slack, and Claude-triggered designs. Those are useful design
options, not claims about Astro's deployed system: a production variant should
use a structured alert or ticket as the source of truth and treat chat as a
trigger or human review surface.

The pipeline's failures also become maintenance evidence. Repeated agent
mistakes exposed opaque abstractions, missing rationale in documentation, and
insufficient tests. Fixing those boundaries improved the next agent run and the
codebase for human contributors too. That is a stronger feedback loop than
merely retrying the same prompt.

## Foreman as a Ready-Made Assembly Line

Vercel Labs' Foreman template packages a similar review-driven loop as a
deployable `eve` software factory. It moves GitHub or Linear work through four
stations:

1. A Classifier decides task type, priority, complexity, and whether the request
   is actionable.
2. An Analyst works from a live checkout and produces a plan with acceptance
   criteria.
3. An Implementer executes in its own sandbox, runs repository checks, and
   pushes a branch.
4. A Reviewer judges the pushed branch against the real diff and attaches
   evidence to its verdict.

Each station has its own instructions, sandbox, and tools. The Reviewer sees the
branch rather than the Implementer's hidden reasoning, making the diff and test
evidence the handoff boundary. A shared “factory brain” supplies repository
notes at the start of later runs without collapsing the four roles into one
context.

Work can arrive through a `factory` issue label, an authorized GitHub mention,
a Linear Agent Session, or a local development TUI. The ordinary output is a
reviewed draft pull request; people still decide when it is ready and whether to
merge. Red CI on factory-owned branches can trigger another bounded diagnosis
and fix, while an ordinary pull request receives only an orienting summary.

The published setup is intentionally Vercel-centric. Its deploy flow configures
GitHub and Linear connectors plus Vercel Blob state, then asks for the target
repository and issue label. Local development links to a Vercel project, pulls
its environment, and runs the TUI; local runs are treated as untrusted, so
GitHub changes wait for explicit approval.

Foreman and Astro's Cloudflare workflow occupy different layers. Foreman is a
ready-made task-to-draft-PR assembly line built on `eve`; Astro's deployed
pipeline is a domain-specific issue-triage state machine, with Flue as the
lower-level runtime extracted from it. The useful common pattern is not their
hosting provider but their explicit stages, isolated execution, durable state,
diff-based review, and retained human judgment.

## Agent Performance Management Beyond Software Review

Alana Levin and Caleb Shack use an employee-management analogy to separate
three parts of deploying agents:

1. Screening tests whether an agent can perform a workflow; offline evaluations
   already cover part of this boundary.
2. Onboarding gives the agent organizational context, tool access, permissions,
   and a place in existing work.
3. Ongoing performance review judges whether completed work is actually good
   and turns feedback into improvement.

Their main interest is the third step. Completion is an inadequate quality
signal when work must also be efficient, conform to tacit organizational
standards, and remain safe under real permissions. The article raises open
questions about who defines quality, whether feedback can compound within an
agent rather than an external evaluation store, who owns company-specific
feedback, when every company needs a custom evaluation layer, and where
liability falls when an agent goes rogue.

This is an organizational evaluation and governance thesis, not a
software-development review method. The commute discussion found the employee
lens distinctive but deliberately connected it to this page's existing review
material: both make verification the constraint after raw capability becomes
cheap. That relationship is synthesis. The source does not claim that employee
performance practices validate code, nor does it report measured results from
a software factory.

## Source Notes

### [Why Software Factories Fail](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md)

<!-- source-item-id: dev-20260724-01 -->

TLDR Dev, 2026-07-24.

This page preserves the article's practical model and the July 24 commute
discussion. The recommendations are experience-driven; they are useful design
hypotheses, not strong empirical evidence that this workflow is universally
optimal.

### [Automating cross-repo documentation with GitHub Agentic Workflows](https://github.blog/ai-and-ml/github-copilot/automating-cross-repo-documentation-with-github-agentic-workflows/?utm_source=tldrdev)

<!-- source-item-id: 19fd6c96b2d39a67-11 -->

TLDR Dev, 2026-08-06.

GitHub's Aspire case study supplies the concrete cross-repository workflow,
security boundary, failure lessons, and reported 30-day results. The published
numbers describe one team after prompt tightening and should not be treated as
an independent comparison with manual documentation processes.

### [How we built a software factory to drive Astro's GitHub issue count to zero](https://blog.cloudflare.com/astro-issue-triage/?utm_source=tldrdev)

<!-- source-item-id: 19ffad638bac0403-02 -->

TLDR Dev, 2026-08-13.

Cloudflare's article describes Astro's real issue-triage pipeline, its
label-and-comment state model, isolated skill stages, reporter verification,
and the Flue framework extracted from that work. Its issue-count reduction is a
first-party operational report, not an independently controlled comparison.

### [Meet Foreman, an eve Software Factory](https://github.com/vercel-labs/eve-software-factory-template?utm_source=tldrnewsletter)

<!-- source-item-id: 19ffffe9eeaeab99-06 -->

TLDR, 2026-08-14.

The MIT-licensed template and README define Foreman's four stations, isolated
review boundary, trigger surfaces, factory memory, Vercel deployment path, and
human approval behavior for local runs. The comparison with Astro and Flue is
synthesis from the August 15 commute discussion and the two projects' published
architecture; it is not a claim that either implementation embeds the other.

### [Hiring Agents Is the Easy Part](https://x.com/AlanaDLevin/status/2087526319999303784)

<!-- source-item-id: 19ffb53bd896ad92-11 -->

TLDR AI, 2026-08-13.

Alana Levin's Variant article, co-authored with Caleb Shack, frames agent
deployment as screening, onboarding, and ongoing performance management. Its
questions about tacit standards, evaluation ownership, permissions, and
liability are an investor and operator thesis, not a validated implementation
or a software-specific review study.

## Related

- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
- {% include wiki-related-link.md slug="claude-code-subagents" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="wide-exploration-narrow-delivery" %}
- {% include wiki-related-link.md slug="human-understanding-in-agentic-coding" %}
