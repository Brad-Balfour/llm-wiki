---
type: concept
title: 'Engineering Practices to Revisit With AI'
aliases: []
tags: ['ai-agents', 'software-engineering']
wiki_slug: engineering-practices-to-revisit-with-ai
created: 2026-11-20
updated: 2026-11-20
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261113-tldr:general-006","url":"https://devonestes.com/bad-ideas-that-arent-bad-anymore"}]
---

# Engineering Practices to Revisit With AI

Devon C. Estes's November 6, 2026 essay asks which costs made familiar
engineering practices undesirable and whether AI has changed those costs.
The commute discussion verified the byline and personal blog, then asked
for all seven examples. The first three came from the author's team.
Brad asked for the original objection and the changed cost for each of the
four ideas the author was still considering.

## Three practices at the author's team

1. **Ticket-owner review.** Claude writes the change and opens the PR. The
   engineer who owns the ticket reviews it, waits for CI and Greptile, and
   merges when satisfied. Estes describes around a month of experience with
   removing the second human reviewer.
2. **Separate workstreams.** Engineers work on different efforts in parallel.
   A teammate can ask Claude how a workstream is designed, where it stands,
   and what remains. The author reports that this reduced the cost of
   catching up in the cases discussed at the team's retrospective.
3. **Less emphasis on framework specialization.** Ready access to framework
   knowledge increases the relative value of architecture, domain modeling,
   product judgment, and understanding users.

## Four practices under consideration

| Practice                    | Earlier objection                                                           | What may have changed                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Rewrite from scratch        | A long rewrite falls behind a moving production system.                     | A rewrite measured in days or weeks gives the systems less time to diverge.                                                             |
| Build an internal tool      | A product covering most requirements is cheaper than months of engineering. | A tailored implementation can be quick enough to change the up-front comparison. Long-term ownership still matters.                     |
| Build three implementations | Implementing two discarded alternatives is expensive.                       | Agents can make competing versions cheap enough for direct comparison or a production A/B test.                                         |
| Adopt unfamiliar technology | The team will have trouble debugging and maintaining it.                    | LLM assistance can lower the entry cost. Estes cites a C# driver for an ANT+/BLE receiver at Beat81 where the team lacked C# expertise. |

The commute discussion compared the early experience with ticket-owner
review to Orlanski's evidence that agents miss existing abstractions.
Faster production and automated checks help explain the change in review
economics. Whether that workflow catches architectural mistakes or
preserves team knowledge over longer periods remains open. Brad requested
a save after the discussion of all seven practices.

## Sources and related entries

- [Devon C. Estes, Bad ideas that aren't bad anymore](https://devonestes.com/bad-ideas-that-arent-bad-anymore)
- [Library Reuse by Coding Agents](library-reuse-by-coding-agents.md)
- [Human Understanding in Agentic Coding](human-understanding-in-agentic-coding.md)

<!-- source-item-id: 20261113-tldr:general-006 -->
