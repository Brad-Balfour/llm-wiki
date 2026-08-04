---
type: concept
title: 'Agent Autonomy Boundaries'
# prettier-ignore
aliases: ["How much can you delegate to agents?","Reviewability and reversibility"]
# prettier-ignore
tags: ["ai-agents","delegation","verification","reversibility","human-in-the-loop","risk-management"]
wiki_slug: agent-autonomy-boundaries
created: 2026-08-03
updated: 2026-08-03
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"19fb2cd8ae0bed24-09","source_path":"sources/tldr/2026-07-31-agent-autonomy-boundaries.txt","url":"https://newsletter.posthog.com/p/agent-autonomy?utm_source=tldrdev"}]
---

# Agent Autonomy Boundaries

The safe ceiling for agent autonomy is a property of the task: how reliably outcomes can be checked and how cheaply harmful consequences can be reversed.

## Key Ideas

- Choose authority from task-level reviewability and reversibility rather than model prestige or a single organization-wide autonomy setting.
- Decompose mixed-risk work so an agent can own easily checked, low-blast-radius pieces while humans retain authority over sensitive boundaries.
- Reversibility concerns consequences, not merely whether a branch or commit can be discarded; production side effects may require compensation and cannot always be undone.
- A delegation contract should name the goal, authority, constraints, acceptance evidence, escalation conditions, and required return artifact.
- Automated tests, scoped credentials, dry runs, staged rollout, feature flags, and current context can raise the autonomy ceiling without eliminating accountability.

## A Task-Level Authority Matrix

The source uses two questions to distinguish four useful operating modes:

| Reviewability | Reversibility  | Default authority                                                            |
| ------------- | -------------- | ---------------------------------------------------------------------------- |
| Hard to check | Costly to undo | Assistant: keep the sensitive core under direct human control.               |
| Hard to check | Cheap to undo  | Human in the loop: let the agent iterate in draft form, then apply judgment. |
| Easy to check | Costly to undo | Delegation: automate the work, but gate the consequential action.            |
| Easy to check | Cheap to undo  | Self-driving: allow unattended execution within the verified boundary.       |

The matrix is a ceiling, not a maturity score. A large task can contain pieces
from every cell. Decomposition is useful because it lets low-risk propagation,
tests, or cleanup move independently while a human retains the small boundary
with ambiguous correctness or a large blast radius.

## Specify the Delegation Boundary

The commute discussion extended the source from a mental model into a concrete
delegation contract. A bounded agent assignment should state:

- the goal and state the agent owns;
- the tools, credentials, and external actions it may use;
- constraints and invariants it must preserve;
- deterministic checks or other acceptance evidence;
- conditions that require escalation; and
- the patch, report, decision, or proof that must return for review.

Specifications, tests, CI, scoped tasks, and review rules are therefore not
ceremony around delegation. Together they make the authority boundary visible
and enforceable.

## Reverse Consequences, Not Just Code

Reversibility changes across an action's lifecycle. Before review, a branch can
usually be discarded cheaply. After merge, a revert may affect other work.
After deployment, rollback can interrupt users or require data restoration.
After an external side effect—such as sending a message, charging a customer,
destroying data, or exposing information—the system may only compensate; it
cannot erase what happened.

The decision question is therefore not merely whether Git can reverse the
code. It is whether the consequences can be returned to an acceptable state,
at what cost, and with what residual harm. Approval should become stricter as
the action moves toward less reversible boundaries.

## Source Notes

### [How much can you delegate to agents?](https://newsletter.posthog.com/p/agent-autonomy?utm_source=tldrdev)

<!-- source-item-id: 19fb2cd8ae0bed24-09 -->

TLDR Dev, 2026-07-30.

PostHog's guide supplies the two-axis model and examples for each level. The
delegation-contract fields and the distinction between reverting code and
reversing consequences are synthesis from the July 31 commute discussion.
The four levels are a practical decision aid, not empirical proof that every
task fits cleanly into one cell.

## Related

- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
- {% include wiki-related-link.md slug="prompt-deployment-gates" %}
