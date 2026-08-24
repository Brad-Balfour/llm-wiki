# Active-workflow refactoring assessment

Date: 2026-08-23  
Baseline: `origin/main` at `1820caf`  
Status: assessment only; implementation belongs in focused follow-ups.

## Decision

The active direct-maintainer workflow does not need a broad rewrite. The best
next refactors are the ones that make the nightly commute measurable and remove
avoidable reruns:

1. finish passive end-to-end performance telemetry under issue #85;
2. characterize and decompose the untested `maintain-commute` orchestration;
3. make active command parsing and private-path checks consistent and
   fail-fast;
4. change validation or split the session-bundle module only when measured
   failures justify the behavior and review risk.

The current 13-run performance baseline predates both the publication-policy
change in PR #89 and the unified orchestration in PR #92. It cannot measure the
new workflow. The next representative commute is the first sample in a new
experiment epoch, not evidence that either change has already reduced time.

## Scope and method

This assessment covers the active TypeScript implementation under `src/`, its
tests, active npm commands, and the public-wiki validator. It excludes the
compiler, approved-source, compile-state, and commute-handoff paths retired by
PR #75.

The baseline combines source size, built-in Node test coverage, change history,
co-change history, import edges, duplicated helpers, command guards, and direct
inspection of the active contracts. Churn is reported both from the direct
maintainer's introduction on July 19 and from the post-retirement period
beginning August 13. The short post-retirement window is directional rather
than statistically stable.

## Current baseline

| Measure                                     |                                                                                                                                                   Current value | Interpretation                                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------ |
| Active TypeScript source                    |                                                                                                                                       6,779 lines in 25 modules | Similar total size to #55, but legacy code has been replaced by recovery and orchestration code. |
| Tests                                       |                                                                                                                                                     198 passing | `npm run check` is green.                                                                        |
| Coverage                                    |                                                                                                                     81.70% line, 82.93% branch, 87.78% function | Aggregate coverage is healthy; orchestration coverage is not.                                    |
| Runtime dependencies                        |                                                                                                                                                               0 | Retain unless an active contract clearly justifies one.                                          |
| Largest module                              |                                                                                                                                `session-bundle.ts`, 1,147 lines | High coverage, but too many responsibilities.                                                    |
| Highest active-workflow churn since July 19 | `feedback-label.ts` 1,202 changed lines; `import-session-bundles.ts` 1,043; `recover-session-bundle.ts` 765; `session-bundle.ts` 475; `maintain-commute.ts` 467 | Intake, recovery, and maintainer orchestration are the hot change axis.                          |
| Top post-retirement co-change               |                                                                                         `import-session-bundles.ts` with `recover-session-bundle.ts`, 3 commits | Recovery remains the most coupled active seam.                                                   |
| Active npm entry points                     |                                                                                                                                             9 workflow commands | They use several parsers, guards, and path-check conventions.                                    |

### Size and coverage hotspots

| Module                                  | Lines | Line coverage | Current assessment                                                                            |
| --------------------------------------- | ----: | ------------: | --------------------------------------------------------------------------------------------- |
| `src/commute/session-bundle.ts`         | 1,147 |        94.03% | Structurally large but well characterized. A split is feasible, not urgent for nightly speed. |
| `src/commute/import-session-bundles.ts` |   921 |        80.51% | High churn and tightly coupled to recovery; refactor only around measured failure seams.      |
| `src/classifier/feedback-label.ts`      |   648 |        80.72% | Cross-package placement remains awkward, with low direct wall-clock impact.                   |
| `src/wiki/maintain-commute.ts`          |   622 |        54.30% | Its orchestration block is untested and mixes the phases #85 needs to measure.                |
| `src/commute/recover-session-bundle.ts` |   619 |        92.35% | High churn and high coverage; prefer small extractions over a rewrite.                        |
| `src/tldr/parser.ts`                    |   582 |        87.38% | Stable enough; sponsor-data separation is cleanup, not a time-saving priority.                |
| `src/commute/github-state.ts`           |    51 |        15.79% | New deterministic boundary; needs characterization before behavior expands.                   |
| `src/commute/run.ts`                    |   120 |        60.42% | New command-local telemetry is not full lifecycle telemetry.                                  |

The coverage command reports built JavaScript because that is what Node
executes. Percentages map directly to their TypeScript source modules.

### Coupling and duplication

The post-retirement co-change pairs with more than one shared commit are:

| Pair                                                      | Co-changes since August 13 |
| --------------------------------------------------------- | -------------------------: |
| `import-session-bundles.ts` ↔ `recover-session-bundle.ts` |                          3 |
| `import-session-bundles.ts` ↔ `session-bundle.ts`         |                          2 |
| `recover-session-bundle.ts` ↔ `session-bundle.ts`         |                          2 |

PRs #58-#60 delivered the most valuable #55 duplication work: one maintenance
contract, shared validation primitives, and a routing decision table. The
remaining duplication is smaller: two `readStdin` helpers, several hashing and
JSON-write helpers, and multiple command parsers. It is worth removing while
touching those boundaries, but it does not justify a broad shared-utility
migration on its own.

The active import graph has no reason to be redesigned wholesale. The notable
boundary smell is `classifier/feedback-label.ts` importing commute contracts
while living in the classifier package. Moving it remains valid cleanup, but
there is no evidence that the file location adds nightly latency.

### Command consistency and testability

The active commands have four material inconsistencies:

- `validate-queue.ts` and `validate-session-bundle.ts` execute `main()` on
  import, while the other executable modules use import-safe guards;
- each command parses arguments independently, and the maintainer parser has a
  characterized case where a following flag is consumed as a missing value;
- the feedback command accepts any path containing a `.private` segment, while
  the intake and maintainer commands anchor output to the repository's
  `.private` directory;
- `maintain-commute.ts` directly owns filesystem, subprocess, clock, temporary
  worktree, retrieval, and result-recording work inside one orchestration path.

These inconsistencies matter to the nightly goal because an unclear parse or
late failure causes a complete rerun and sometimes a user interruption. A
single large CLI framework would be disproportionate; a small active-command
parser and one private-path guard are enough.

## Performance experiment boundary

Issue #85 records a pre-change median gross lifecycle of 48.9 minutes, a
16.6-minute median pre-PR phase, and a 23.0-minute median PR review/rework phase.
Every one of those runs used Sol Medium. PR #89 changed the review and
commentary policy, and PR #92 added `commute:run`, deterministic preflight, and
batched GitHub state. There are zero representative runs after both changes.

The experiment should therefore use this fixed sequence:

1. run the first representative post-change commute on Sol Medium as the new
   control;
2. run the next on Terra Medium;
3. alternate Sol Medium and Terra Medium for 6-10 representative runs while
   prompts, validation, review policy, and orchestration remain fixed;
4. test Terra Low only if Terra Medium preserves validation, conversation
   coverage, provenance, and publication quality;
5. record exclusions and every escalation back to Sol Medium.

Telemetry must remain passive. It must not add acknowledgments or routine user
responses. `commute-run.v1` currently stops at command completion and lacks the
task invocation, PR creation, merge, cleanup, model/effort, tool time, user
interventions, review cycles, and quality outcomes required by #85. A private
versioned finalizer is the smallest missing prerequisite.

## Ranked implementation backlog

### 1. Finalize passive lifecycle metrics for #85

**Type:** operational tooling and measurement contract, not a behavior-
preserving refactor.  
**Active files:** new focused performance module and tests around
`src/commute/run.ts`; a private output under `.private/`; one concise operator
document.  
**Expected benefit:** makes gross, pre-PR, PR-to-merge, post-merge, model,
effort, tool time, intervention count, review cycles, and quality outcomes
comparable without another user prompt. This is required to rank later work by
actual wall-clock return.  
**Risk:** low if it only validates and derives a final private record; medium if
it mutates the live orchestration.  
**Dependencies:** consume `commute-run.v1`; preserve the PR #89 low-
interruption policy.  
**Validation:** reject missing, negative, or out-of-order timestamps; derive all
phase durations; enforce private output; preserve escalation and quality data;
run the first Sol Medium control only on a representative daily commute.  
**Issue:** #85.

### 2. Characterize and decompose maintainer orchestration

**Type:** behavior-preserving refactor first; additive phase telemetry, if
included, is a separate measurement-contract change.  
**Active files:** `src/wiki/maintain-commute.ts`,
`tests/maintain-commute.test.ts`, and only the minimum shared types needed by
the extracted phases.  
**Expected benefit:** isolates intake, retrieval, maintainer launch, and result
recording so a failure can resume at the correct boundary. It also exposes the
pre-PR phases that #85 currently cannot distinguish. Fewer whole-pass retries
mean less wall time and fewer requests for user recovery.  
**Risk:** medium because this is the PR-creating path and its main orchestration
is not currently executed by tests.  
**Dependencies:** add success, retrieval-failure, launcher-failure, malformed-
result, and retry characterization before moving logic. Keep worktree/branch
and structured-result behavior unchanged.  
**Validation:** focused phase tests with injected filesystem, process, and
clock dependencies; unchanged fixtures and error text; `npm run check`; strict
validation of both active OpenSpec changes if requirements change.

### 3. Make active commands import-safe and fail-fast

**Type:** mixed. Extracting a shared parser/guard is behavior-preserving;
rejecting a following flag as a missing value is an intentional CLI correction
and must be called out separately.  
**Active files:** the two validators, `commute/preflight.ts`, `commute/run.ts`,
`commute/import-session-bundles.ts`, `wiki/maintain-commute.ts`,
`classifier/feedback-label.ts`, and focused CLI tests.  
**Expected benefit:** catches bad invocations before build, retrieval, or
maintainer launch; enables direct command imports in tests; removes a class of
avoidable reruns.  
**Risk:** low-medium because scripts and exact errors are operator-facing
contracts.  
**Dependencies:** build around `commute:run`; do not resurrect the retired
ten-command proposal. Decide one repository-root `.private` rule.  
**Validation:** table-driven missing/duplicate/unknown flag cases for every
active command; subprocess smoke tests; unchanged happy-path output.

### 4. Extract the session lifecycle validator, then reassess table driving

**Type:** behavior-preserving module split. Any change to accumulated errors or
accepted bundles is a separate contract change.  
**Active files:** `src/commute/session-bundle.ts`, a new lifecycle/event module,
and existing session-contract fixtures.  
**Expected benefit:** reduces conflict and review risk in the hottest recovery
axis. The direct nightly benefit is indirect: faster, safer fixes when Voice or
recovery semantics change.  
**Risk:** medium despite high coverage, because PRs #82 and #91 recently changed
event and discussion semantics.  
**Dependencies:** preserve public exports during parallel migration; refresh,
do not merge, stale PR #65.  
**Validation:** all session-contract fixtures unchanged; export-compatibility
test; one move per commit; `npm run check`.

### 5. Accumulate intake validation errors only if reruns are measured

**Type:** product/contract change, not a refactor.  
**Active files:** bundle and queue validators, validation CLIs, schemas/docs,
and their tests.  
**Expected benefit:** one malformed artifact can report all independent defects
in one pass instead of creating a fix-run-fix loop.  
**Risk:** medium-high because ordering, wording, and fail-soft boundaries are
observable behavior.  
**Dependencies:** #85 must first show repeated validation reruns or user
recovery requests.  
**Validation:** explicit error ordering and completeness fixtures; no loss of
independently valid sessions; strict OpenSpec validation.

### 6. Low-priority structural hygiene

Move feedback labeling to a neutral package, share small filesystem/hash
helpers, separate parser sponsor data, and remove dead exports only when those
files are otherwise touched. Stale PRs #62-#64 must be refreshed from current
`origin/main`, not merged as-is. These changes improve navigation and DRY but
have no measured direct effect on nightly wall time.

## Candidates where no change is recommended now

- **Branded identifiers:** still technically useful, but no current type-mixup
  defect or wall-clock benefit justifies a cross-repository migration.
- **Zod and generated schemas:** PR #75 removed half the old schema surface.
  Adding the first runtime dependency and replacing the active validators is
  not supported by the remaining duplication.
- **Routing:** the decision table is delivered, readable, and at 100% coverage.
- **Parser structure:** refresh PR #62 only if parser churn resumes; the current
  parser is well covered and not a measured nightly bottleneck.
- **Public-surface cleanup:** use litter-pickup in touched files, not a standalone
  project.
- **Standalone documentation pass:** documentation consistency is already a
  requirement of each contract or CLI change.

## Issue #55 disposition

| #55 item                                   | Current disposition                               | Evidence and next decision                                                                             |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1. Characterization tests                  | Delivered                                         | PR #57; active maintainer helper/retrieval tests remain. Orchestration coverage belongs with item 13.  |
| 2. Maintenance-candidate contract          | Delivered                                         | PR #58; `src/commute/maintenance.ts` is the single owner.                                              |
| 3. Branded identifiers and shared identity | Retained, deferred                                | Plain strings remain; no measured nightly payoff.                                                      |
| 4. Shared validation primitives            | Delivered                                         | PR #59; use litter-pickup for small vocabulary erosion.                                                |
| 5. Routing decision table                  | Delivered                                         | PR #60; recommend no change.                                                                           |
| 6. Move feedback label package             | Retained, low priority                            | Open PR #63 is stale and must be refreshed.                                                            |
| 7. Shared file I/O and hashing             | Retained, low priority                            | Open PR #64 is stale/stacked; share helpers only with touched paths.                                   |
| 8. Table-driven validators                 | Retained conditionally                            | Open PR #65 predates later bundle semantics; refresh only after lifecycle extraction or measured need. |
| 9. One error strategy                      | Retained as contract decision                     | Consider multi-error intake only if #85 records rerun cost.                                            |
| 10. Zod/schema generation                  | Superseded                                        | PR #75 removed three retired contracts; reevaluate parity narrowly if drift recurs.                    |
| 11. Unified CLI layer                      | Broad version superseded; narrow version retained | PRs #75 and #92 reduced the surface. Implement active import/parse/path consistency only.              |
| 12. Split session bundle                   | Retained conditionally                            | Larger now, but high coverage and no direct timing evidence. Start with lifecycle boundaries.          |
| 13. Decompose maintainer main              | Retained, high priority                           | Best behavior-preserving support for phase telemetry and resumable failures.                           |
| 14. Separate compiler rendering            | Invalidated                                       | Compiler and approval workflow were deleted by PR #75.                                                 |
| 15. Parser data/logic separation           | Retained, low priority                            | Open PR #62 is stale after later parser behavior changes.                                              |
| 16. Narrow public surface                  | Retained as litter-pickup                         | Do not create a standalone migration.                                                                  |
| 17. Documentation pass                     | Superseded as standalone work                     | PR #75 cleaned retired docs; update docs with each selected change.                                    |

Primary count: 4 delivered, 9 retained, 3 superseded, and 1 invalidated. Item
11 is the mixed case: the original broad design is superseded, while a smaller
active-command consistency change remains useful.

## Reproduction

Run from a clean checkout of the recorded baseline with Node 24 and npm 11:

```sh
npm run ci:install
npm run check
find src -name '*.ts' -print0 | xargs -0 wc -l | sort -nr
node --experimental-test-coverage --test dist/tests/*.test.js
rg -c '^import .* from' src -g '*.ts' | sort -t: -k2,2nr
rg -n 'process\.argv|import\.meta\.url|await main\(|parse[A-Za-z]+Options|parseArgs' src -g '*.ts'
git log --since=2026-08-13 --numstat --format= -- src
git log --since=2026-08-13 --format='@@%H' --name-only -- src
```

For churn, sum additions plus deletions by path. For coupling, split the
name-only log at each `@@` marker and count unordered TypeScript path pairs once
per commit. Use only paths present in the active tree for the July 19 lifetime
ranking; the August 13 window already follows retirement.
