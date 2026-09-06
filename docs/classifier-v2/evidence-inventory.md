# Evidence for classifier v2

The initial review read all 16 open GitHub issues and their 74 comments at the
September 5, 2026 snapshot, plus the commute experiment log through September 4.
Brad’s subsequent review establishes the requirements in this directory. This
page keeps the sources needed to implement them; it is not an additional backlog.

## Issue coverage

| Issue                                                                                                | Use in this upgrade                                                                                                     |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [#35 — Classifier feedback](https://github.com/Brad-Balfour/llm-wiki/issues/35)                      | Exact corrections, author/topic preferences, unclear headlines and separation of scoring errors from playback errors    |
| [#66 — Articles omitted and feedback collection](https://github.com/Brad-Balfour/llm-wiki/issues/66) | Review all articles, including omitted ones, and recover usable labels without inventing old routing versions           |
| [#68 — Classifier improvement](https://github.com/Brad-Balfour/llm-wiki/issues/68)                   | Compare revised instructions with Brad’s answers; use the lightweight acceptance process in the current runbook         |
| [#36 — Daily duplicates](https://github.com/Brad-Balfour/llm-wiki/issues/36)                         | Exact URLs, same-story coverage, useful updates and retaining the useful source context while generating in the Project |
| [#37 — Scheduled file output](https://github.com/Brad-Balfour/llm-wiki/issues/37)                    | Preserve unattended Project generation and the proven manual phone recovery for a failed write                          |
| [#100 — Voice playback](https://github.com/Brad-Balfour/llm-wiki/issues/100)                         | Test actual spoken output; correct JSON alone does not establish a good commute                                         |
| [#26 — Wiki source quality](https://github.com/Brad-Balfour/llm-wiki/issues/26)                      | Keep source URLs, source descriptions and explicit saves usable after the file split                                    |
| [#94 — Command validation](https://github.com/Brad-Balfour/llm-wiki/issues/94)                       | Validate the new reference-file argument before doing work; preserve current command behavior                           |
| [#95 — Session import](https://github.com/Brad-Balfour/llm-wiki/issues/95)                           | Add only the pair/snapshot reader compatibility needed by this release                                                  |
| [#96 — Wiki processing](https://github.com/Brad-Balfour/llm-wiki/issues/96)                          | Existing wiki processing remains compatible; no refactor required for classifier v2                                     |
| [#85 — Commute processing performance](https://github.com/Brad-Balfour/llm-wiki/issues/85)           | Avoid adding work to the daily workflow; this is not an article-classifier benchmark                                    |
| [#119 — Phase timing](https://github.com/Brad-Balfour/llm-wiki/issues/119)                           | No new timing subsystem is needed for this release                                                                      |
| [#48 — Stalled wiki runs](https://github.com/Brad-Balfour/llm-wiki/issues/48)                        | Separate wiki-processing work                                                                                           |
| [#8 — Pages caching](https://github.com/Brad-Balfour/llm-wiki/issues/8)                              | Separate website work                                                                                                   |
| [#52 — Wiki search](https://github.com/Brad-Balfour/llm-wiki/issues/52)                              | Separate website work                                                                                                   |
| [#112 — Workspace organization](https://github.com/Brad-Balfour/llm-wiki/issues/112)                 | Separate workspace work                                                                                                 |

The relevant closed issues are [#106](https://github.com/Brad-Balfour/llm-wiki/issues/106),
which introduced prepared playback strings, and
[#120](https://github.com/Brad-Balfour/llm-wiki/issues/120), which shortened the
Voice prompt and contains the two-file suggestion. Their implemented work is
the starting point, not proof that Voice always reads the strings correctly.

## Sources to use during implementation

- [Commute findings for the five improvements](commute-log-review.md): direct
  links to the recorded examples and the corrections to include.
- [Live Project source list](../../chatgpt-project/README.md): installed files and
  the established manual recovery/replacement procedure.
- [Current generation instructions](../../chatgpt-project/queue-generation-v3.md),
  [classifier instructions](../../schema/classifier-instructions.md) and
  [interest profile](../../schema/interest-profile.md): baseline for the new files.
- [Operating-loop design](../../openspec/changes/commute-wiki-operating-loop/design.md)
  and [bootstrap design](../../openspec/changes/bootstrap-llm-wiki-mvp/design.md):
  preserve the working journeys while updating the specific changed requirements.

The historical research archive in the parent workspace contains existing labels
and comparisons: `codex-docs/tldr-interest-profile-session-state.md`,
`codex-docs/schema/tldr-holdout-comparison.md`,
`codex-docs/schema/tldr-fresh-holdout-comparison-two-axis.md` and
`codex-docs/schema/tldr-fresh-holdout-comparison-two-axis-calibration-v2.md`.
Use these read-only to locate reusable answers. The recorded sets contain 262
training articles, 41 June 30 articles and 98 July 1–2 articles; they have already
been used in classifier development. Reuse their labels without claiming they
are fresh final-check data or copying private research into Git.

## Available email evidence

The planning search found 85 recent Trash message candidates and 10 older
candidates through read-only ID searches. These are not verified counts of
newsletters or articles. No bodies were collected and no mailbox state changed.
The implementation must verify available dates, editions and content before
selecting historical runs. Search results do not establish an unused final set.

Collect recoverable inputs promptly. Use available recent days and record missing
editions; no particular historic date is required. Save private article extracts
and labels under `.private/`, keeping raw email bodies out of Git.
