---
type: concept
title: 'Library Reuse by Coding Agents'
aliases: []
tags: ['ai-agents', 'software-engineering']
wiki_slug: library-reuse-by-coding-agents
created: 2026-11-20
updated: 2026-11-20
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261113-tldr:general-005","url":"https://gabeorlanski.github.io/posts/slop-moves-up/"}]
---

# Library Reuse by Coding Agents

Gabriel Orlanski's benchmark analysis places a design problem alongside improvements
in line-level code quality. With minimal guidance, each tested model duplicated
available library functionality in 73–100% of solutions. The more prescriptive
setup reported about 17% reimplementation with human-written libraries and
40% with agent-written libraries. A separate measure counted workarounds for
broken or ill-fitting libraries at 27% and 40%, respectively. These rates
describe the reported benchmark setups.

Eight of twelve agents used a Python heap for event ordering in a SimPy task
that could use the existing scheduler. In the Beautiful Soup case, one agent
inspected the source and then wrote its own regex-based encoding detector.
All twelve minimally instructed models duplicated that functionality. All three
implementers in the prescriptive setup called the library's detector.

## Commute discussion

The investigation started with the failed byline lookup. The discussion
established Orlanski as the author and his personal site as the publisher.
Brad then asked what the experiments actually showed about code reuse and why
an agent might duplicate a function it had already seen. The benchmark measures
the behavior. The suggestion that agents start implementing before mapping the
task to existing abstractions is a working explanation from the discussion.
Workarounds for library defects and mismatched APIs give another explanation
for some duplication.

Brad asked for stronger prompts and examples, then narrowed the request to the
actual benchmark instruction. A network interruption cut off the explanation.
On retry, Brad emphasized that the experimental results could not answer the
request for wording. The benchmark repository supplied the original instruction,
including the requirement to keep the solution a thin adapter and to treat
reimplementation as a last resort.

The instruction asks an implementer to:

1. Read the README and documentation, inspect examples, and search the source
   for the required concepts. Map each requirement to an available entry point
   or establish that the library lacks it.
2. Call the entry point that handles the whole operation, such as a parser or
   pipeline. Configure or extend the library when its defaults differ.
3. Audit every new function, loop, branch, and check. Replace it with a library
   call where possible and explain what still needs handwritten code.
4. Run the sample inputs and verify the expected output.

The discussion singled out the line-by-line reuse audit as the actionable
change. It also considered the complementary library design problem of building
APIs around likely downstream tasks, giving consumers runnable examples, and
checking discoverability with fresh agents. Brad asked to preserve the exchange,
the direct prompt link and the distinction between measured behavior and
possible explanations.

## Sources and related entries

- [Gabriel Orlanski, Slop Is Moving Up the Stack](https://gabeorlanski.github.io/posts/slop-moves-up/)
- [LibraryDesignBench's complete library-use instruction](https://github.com/SprocketLab/librarydesignbench/blob/main/configs/prompts/library_use_inst.md)
- [Engineering Practices to Revisit With AI](engineering-practices-to-revisit-with-ai.md)

<!-- source-item-id: 20261113-tldr:general-005 -->
