---
type: concept
title: 'Claude Code Subagents'
# prettier-ignore
aliases: ["Custom Claude Code subagents","Claude Code agent definitions"]
# prettier-ignore
tags: ["claude-code","ai-agents","developer-workflows","context-management"]
wiki_slug: claude-code-subagents
created: 2026-07-22
updated: 2026-07-29
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"url_7dc93e85c023d968","url":"https://code.claude.com/docs/en/sub-agents"}]
---

# Claude Code Subagents

Claude Code subagents are reusable specialist definitions that run delegated
work in their own context window. A definition combines a focused prompt with
model choice, allowed tools, and permissions, allowing a team to make repeated
engineering workflows more consistent without filling the main conversation
with every intermediate search result or log.

## Key Ideas

- Subagents isolate task-specific exploration and return a result to the parent
  session, preserving the main context for the work that needs it.
- Project definitions live in `.claude/agents/`; user-level definitions live in
  `~/.claude/agents/`. Both are Markdown files with YAML frontmatter and can be
  reviewed and shared through normal version control.
- Tool restrictions and explicit prompts let a team create constrained workers,
  such as read-only reviewers, instead of relying on one unconstrained general
  agent for every task.
- The definitions are durable engineering assets, while each delegated run is a
  fresh execution with its own task context.

## Operating Model

The useful distinction is between reusable procedures and reusable workers.
Skills capture instructions, references, and artifacts for a kind of work.
Subagent definitions add a worker boundary: a focused system prompt, a context
window, a model choice, tool access, and permissions. They are complementary
building blocks rather than competing ways to package a team workflow.

- Put a project-specific specialist in `.claude/agents/` when its behavior,
  tool access, and prompt deserve the same review and version-control treatment
  as the codebase it serves.
- Use a narrow, least-privilege definition for review work. A read-only
  architecture, security, or code-review agent is easier to evaluate than a
  broad worker that can silently edit while giving advice.
- Keep the definition persistent but assume an invocation is task-scoped. That
  makes subagents useful for research, review, and noisy exploration that would
  otherwise crowd out the parent agent's context.
- A shared agent library should be managed like any other engineering asset:
  named owners, reviewable changes, documented triggers, and tests or examples
  for high-impact behavior. Copying Markdown is easy; maintaining trustworthy
  behavior is the real work.

## Source Notes

### [Create custom subagents](https://code.claude.com/docs/en/sub-agents)

<!-- source-item-id: url_7dc93e85c023d968 -->

Saved during the July 22 TLDR Dev commute as a high-priority item for later
team sharing. The recovered session transcript preserves the explicit save;
the downloaded queue snapshot does not retain the original item title and URL
consistently enough to use as queue-item provenance. The page instead uses a
deterministic identity for the cited public documentation URL.

The official documentation describes built-in and custom subagents, their
isolated contexts, file-based scopes, tool restrictions, and permission
configuration. The operating guidance above is a synthesis from the commute
discussion, not a claim that Claude Code automatically provides an
organization's agent-governance process.

## Related

- {% include wiki-related-link.md slug="adaptive-context-engineering" %}
- {% include wiki-related-link.md slug="ai-native-software-engineering" %}
- {% include wiki-related-link.md slug="mantis-skills" %}
- {% include wiki-related-link.md slug="orchestrator-working-memory" %}
- {% include wiki-related-link.md slug="production-ai-agent-architecture" %}
