---
type: concept
title: 'Long-Running Agent Harnesses'
# prettier-ignore
aliases: ["The Coming Loop","Hidden Technical Debt of AI Systems: Agent Harness","Codex-maxxing for long-running work","Autoresearch","Software Factories, Light and Dark","The Continuous Thunderdome"]
# prettier-ignore
tags: ["ai-agents","agent-harnesses","long-running-agents","software-factories","verification","context-management","feedback-loops"]
wiki_slug: long-running-agent-harnesses
created: 2026-08-24
updated: 2026-08-24
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"url_1fbd37ebeb0805e9","url":"https://openai.com/index/codex-maxxing-long-running-work/"},{"source_item_id":"url_d3b96db102288163","url":"https://leehanchung.github.io/blogs/2026/05/08/hidden-technical-debt-agent-harness/"},{"source_item_id":"url_2eece697b1d063df","url":"https://lucumr.pocoo.org/2026/6/23/the-coming-loop/"},{"source_item_id":"url_7e29fd14ca16f2a8","url":"https://www.latent.space/p/autoresearch-introspection"},{"source_item_id":"url_6becd8bc303db51e","url":"https://yegge.ai/essays/the-shape-of-things-to-come/"},{"source_item_id":"url_050f975f8d6191b8","url":"https://addyo.substack.com/p/software-factories-light-and-dark"}]
---

# Long-Running Agent Harnesses

A long-running agent harness keeps a goal alive beyond one model turn by preserving state, selecting the next action, evaluating progress, and deciding whether work should continue, stop, or escalate.

## Key Ideas

- The loop is the repeated unit of work; the harness supplies its tools, memory, permissions, budget, and completion gates.
- Durable project state should live outside a single context window in inspectable artifacts such as plans, progress records, tests, commits, and task graphs.
- A production harness should be narrow, observable, and easy to replace as model capabilities change; training and research harnesses have different requirements.
- More autonomous loops increase the importance of verifiers, cost limits, scoped credentials, audit logs, and human escalation.
- A software factory is not merely a larger agent. It is a collection of harnessed loops with a work queue, shared evidence, and a governed path to production.

## State and Completion Live Outside the Model

An agent normally stops when its own turn-level reasoning says it is done. A harness can keep the task alive by checking external state and then continuing the session, starting a fresh one with retained evidence, or routing the work elsewhere. This makes the completion contract an engineering artifact rather than a conversational impression.

The most durable state is usually simple and inspectable: an accepted plan, a list of remaining work, test output, repository history, and explicit blockers. OpenAI's long-running-work guide emphasizes verifiable decomposition and persistent workspaces. Armin Ronacher similarly describes queues and outer loops that decide whether a model's apparent stopping point is actually the end.

## Harnesses Should Be Replaceable

Han Lee frames prompts, tools, context management, memory, subagent topology, guardrails, verifiers, and observability as one evolving harness layer. Some of that structure compensates for a particular model generation's weaknesses. Treating it as permanent architecture can turn yesterday's workaround into tomorrow's constraint.

This creates two simultaneous requirements:

- keep production authority narrow through allowlists, scoped credentials, idempotent retries, runtime limits, and auditability; and
- keep orchestration modular enough to remove when a stronger model can reliably own the behavior itself.

## Outer Loops Need Signals, Not Just More Tokens

Autoresearch extends the loop from doing work to improving the system that does the work. The proposed “agent recipe” records the harness, evaluators, judges, human feedback, failures, and model choices that produced a working configuration. That history matters because source code alone does not explain why a loop evolved into its current shape.

The source is an interview about an emerging product category, not independent evidence that self-improving factories are broadly reliable. Its practical starting point is narrower: identify valuable feedback signals, control cost, retain human questions as first-class inputs, and use Git or another durable ledger as the audit trail.

## Automation Must Earn the Dark

Addy Osmani distinguishes a lit factory, where people own consequential judgment, from a dark factory whose code is produced and verified only by machines. The useful rule is back-pressure: grant no more autonomy than the system can cheaply and reliably verify.

Short, low-blast-radius loops can earn unattended operation when they have fast, stable, difficult-to-game oracles. Product intent, architecture, security boundaries, billing behavior, and public contracts usually need human judgment earlier in the loop. Moving that judgment upstream can be more scalable than reviewing an enormous generated diff after the design has already multiplied.

Steve Yegge's Wheelhouse account is a vivid practitioner report about persistent identities, task graphs, high token consumption, and large agent fleets. Its predictions about the end of CI/CD or human code review are speculative, and its extraordinary throughput and cost claims are self-reported. The durable lesson is to measure the operating system around the agents—work supply, state, convergence, verification, and cost—not to assume one bespoke setup generalizes.

## Source Notes

### [Codex-maxxing for long-running work](https://openai.com/index/codex-maxxing-long-running-work/)

<!-- source-item-id: url_1fbd37ebeb0805e9 -->

OpenAI, 2026-06-22. The landing page introduces Jason Liu's guide to persistent workspaces, verifiable decomposition, continuity across workstreams, and deliberate human delegation.

### [Hidden Technical Debt of AI Systems: Agent Harness](https://leehanchung.github.io/blogs/2026/05/08/hidden-technical-debt-agent-harness/)

<!-- source-item-id: url_d3b96db102288163 -->

Han Lee, 2026-05-08. A detailed practitioner synthesis of harness layers, research-versus-production requirements, and the risk of making temporary orchestration load-bearing.

### [The Coming Loop](https://lucumr.pocoo.org/2026/6/23/the-coming-loop/)

<!-- source-item-id: url_2eece697b1d063df -->

Armin Ronacher, 2026-06-23. Describes the outer-loop pattern that keeps a task alive after a coding agent would normally stop.

### [Autoresearch: The feedback loop behind self-improving agents](https://www.latent.space/p/autoresearch-introspection)

<!-- source-item-id: url_7e29fd14ca16f2a8 -->

Latent Space, 2026-07-01. Interview with Introspection co-founder Roland Gavrilescu about outer loops, agent recipes, feedback signals, cost, and retained human input.

### [The Shape of Things to Come, Part 1: The Continuous Thunderdome](https://yegge.ai/essays/the-shape-of-things-to-come/)

<!-- source-item-id: url_6becd8bc303db51e -->

Steve Yegge, 2026-08. A self-reported account of the bespoke Wheelhouse harness and its agent fleet; its broader forecasts remain unvalidated.

### [Software Factories, Light and Dark](https://addyo.substack.com/p/software-factories-light-and-dark)

<!-- source-item-id: url_050f975f8d6191b8 -->

Addy Osmani, 2026-07-22. Connects loops, harnesses, factories, verification back-pressure, comprehension debt, and human ownership of the outer loop.

## Related

- {% include wiki-related-link.md slug="review-driven-software-factories" %}
- {% include wiki-related-link.md slug="deterministic-agent-workflows" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="agent-context-handoff" %}
