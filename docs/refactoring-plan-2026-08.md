# Repository refactoring plan (issue #55)

Status: proposal. Implementation is a follow-on if this plan is accepted.

## 1. Scope and method

This plan covers the TypeScript implementation under `src/` (6,723 lines, 24
modules) and `scripts/`. Markdown is in scope only where a code change forces a
documentation update. OpenSpec and other spec-driven-development files are not
refactored; they are treated as the contracts the code must keep satisfying.

Baseline measured on `claude/issue-55-refactoring-wru26c` at the current `main`
content: `npm test` is green with **139 passing tests**, and the TypeScript
configuration is already strict (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noUnusedLocals`). ESLint
and Prettier are wired into `npm run check`. The codebase is in good shape at
the type and tooling level; every problem below is a structural one.

Quality attributes assessed: DRY, understandability, maintainability,
simplicity, reliability/consistency, and testability.

Constraints taken from `AGENTS.md` and applied throughout:

- Preserve source provenance, stable identifiers, and idempotence.
- Classifier output stays source-neutral; routing stays in `src/routing/`.
- No schema or stored-record migration without its own OpenSpec change.
- Bootstrap v1/v2 handoffs and the current compiler remain runtime default.

Unless a proposal is explicitly marked **behavior change**, it is intended to be
behavior-preserving and validated by the existing suite.

## 2. Ordered proposals

Ordered by return on investment: the amount of future editing cost removed per
unit of implementation risk.

| #   | Change                                      | Primary location                                        | Extent           | Risk       |
| --- | ------------------------------------------- | ------------------------------------------------------- | ---------------- | ---------- |
| R1  | Shared validation primitives                | new `src/shared/`, 11 modules                           | ~-500 / +220 LOC | Medium-low |
| R2  | Unified CLI entrypoint layer                | new `src/cli/`, 10 CLI modules                          | ~-200 LOC        | Medium     |
| R3  | Split `commute/session-bundle.ts`           | 1 file → 8                                              | 1,079 LOC moved  | Low        |
| R4  | Single maintenance-candidate contract       | `commute/`, `wiki/retrieve-maintenance-sources.ts`      | ~-60 LOC         | Low        |
| R5  | Table-drive branch-heavy validators         | `commute/session-bundle.ts`, `classifier/validation.ts` | ~-150 LOC        | Low-medium |
| R6  | Routing decision table                      | `routing/derive.ts`                                     | ~-30 LOC         | Very low   |
| R7  | Separate wiki Markdown rendering from merge | `wiki/compiler.ts`, `wiki/compile-file.ts`              | ~260 LOC split   | High       |
| R8  | Shared file-IO and hashing helpers          | new `src/shared/`, 8 modules                            | ~-90 LOC         | Low        |
| R9  | Decompose `maintain-commute.ts` `main()`    | `wiki/maintain-commute.ts`                              | 161-line fn      | Medium     |
| R10 | Parser data/logic separation                | `tldr/parser.ts`                                        | ~-40 LOC         | Low        |
| R11 | Documentation consistency pass              | `README.md`, `AGENTS.md`, `docs/`, `chatgpt-project/`   | Docs only        | Very low   |

### R1. Extract shared validation primitives — highest ROI

**Problem.** The same hand-rolled validation primitives are redeclared across
nine modules. Measured counts:

| Primitive              | Copies | Files                                                                                                                                                                    |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `errorMessage`         | 9      | approved-source, retrieve-maintenance-sources, maintain-commute, ingest-handoff, feedback-label, handoff, import-session-bundles, recover-session-bundle, session-bundle |
| object-shape check     | 9      | as `requireRecord` / `requireObject` / inline `typeof !== 'object'` blocks                                                                                               |
| non-empty string check | 10     | as `requireString` / `requireNonEmpty` / `requiredString` / `requireNonEmptyString`                                                                                      |
| `requireEnum`          | 4      | approved-source, feedback-label, handoff, session-bundle                                                                                                                 |
| `rejectUnknownKeys`    | 4      | approved-source, feedback-label, handoff, session-bundle                                                                                                                 |
| `requireHttpUrl`       | 4      | approved-source, import-session-bundles, session-bundle, retrieve (inline)                                                                                               |
| `stripMarkdownFence`   | 3      | approved-source, handoff, session-bundle                                                                                                                                 |
| `requireStringArray`   | 3      | approved-source, handoff, session-bundle                                                                                                                                 |
| `requireArray`         | 3      | handoff, recover-session-bundle, session-bundle                                                                                                                          |
| `optionalString`       | 3      | handoff, recover-session-bundle, session-bundle                                                                                                                          |

This is not only verbosity; the copies have **drifted in ways that matter**:

- `requireHttpUrl` in `session-bundle.ts:1001` catches the `URL` constructor and
  throws a field-scoped message. The copy in `import-session-bundles.ts:533`
  does not catch, so a malformed prior-record URL surfaces as a raw
  `TypeError: Invalid URL` instead of a contract error naming the field.
  `approved-source.ts:186` adds credential-parameter and Markdown-safety checks
  the others lack. `retrieve-maintenance-sources.ts:320` has a fourth variant.
- Date validation similarly diverges: `feedback-label.ts:529` `validateCalendarDate`
  rejects impossible dates, while `session-bundle.ts:982` `requireDate` only
  checks the `YYYY-MM-DD` pattern plus `Date.parse`, which silently rolls over.
  Verified: `Date.parse('2026-02-31T00:00:00Z')` returns a valid timestamp
  (3 March), so a queue `edition_date` of `2026-02-31` passes bundle validation
  and would be rejected by the feedback recorder.
- Error wording differs for the same failure: `handoff.ts` says
  `contains unsupported fields`, `feedback-label.ts` says
  `has unknown field(s)`; `handoff.ts` says `must contain unique values`,
  `session-bundle.ts` says `must not contain duplicates`.

Every contract tightening today is a 4-to-10-place edit with no mechanism
ensuring the places stay in sync.

**Change.** Add `src/shared/` with narrowly scoped modules:

- `validate.ts` — `requireRecord`, `requireString`, `requireEnum`,
  `requireArray`, `requireStringArray`, `requirePositiveInteger`,
  `requireScore`, `requireUniqueStrings`, `rejectUnknownKeys`, `optionalString`.
- `url.ts` — one `requireHttpUrl(value, field, options)` with explicit flags
  (`protocols`, `rejectCredentials`, `markdownSafe`, `rejectCredentialParams`)
  so each caller declares the strictness it needs instead of owning a copy.
- `time.ts` — `requireDate` (real-calendar-date semantics; adopt the stricter
  `feedback-label` behavior everywhere), `requireDateTime`, `requireIsoTimestamp`.
- `json.ts` — `stripMarkdownFence`, `parseJsonObject`.
- `errors.ts` — `errorMessage`, `errorCode`, `isMissingFile`, `isExistingFile`.

**Sub-decision to confirm before implementing:** error strings are effectively an
operator-facing contract and several tests assert them. Recommendation is to
normalize on one wording per failure class and update the small number of
asserting tests in the same commit, listing each changed message in the PR body.
The alternative — parameterizing the message per call site — preserves output
exactly but keeps a chunk of the duplication, so it is not recommended.

**Considered and rejected: adopt a schema library (zod/valibot).** It would
delete more code than any proposal here, but the repository currently has zero
runtime dependencies, and the CLI error text that operators read would become
library-shaped. Keeping validation hand-rolled but centralized preserves both
properties. Revisit only if contract count grows substantially.

**Guard.** Per the failure-driven-improvements rule, add a focused test (or an
ESLint `no-restricted-syntax` rule) that fails when a module outside
`src/shared/` declares a function named like a shared primitive. Without it the
duplication re-accumulates.

### R2. Unified CLI entrypoint layer

**Problem.** Ten modules hand-roll argument parsing (~335 lines total) with four
mutually incompatible behaviors, and five different ways of deciding whether the
module is the process entrypoint.

Argument parsing inconsistencies:

- `tldr/ingest-file.ts:135` and `classifier/feedback-label.ts:644` validate that
  the next token is not another flag.
- `wiki/compile-file.ts:413` (`--state`) and `wiki/ingest-handoff.ts:737`
  (`--enrichment-dir`) do not: a value-taking flag swallows whatever token
  follows it, including another flag. Traced concretely:
  `compile:wiki -- --input a --state --confirm-public` sets `statePath` to the
  literal string `--confirm-public`, consumes it, and then fails with
  "Public compilation requires --confirm-public" even though the operator
  passed it. The failure is a misleading error rather than a silent wrong
  action, but it is unnecessary and the fix is uniform.
- `commute/import-session-bundles.ts:626` and `wiki/maintain-commute.ts:482`
  throw on a missing value but with per-flag ad-hoc messages.
- Usage text lives inline in each parser in four different shapes.

Entrypoint-guard inconsistencies (`src/`):

- `fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')` —
  feedback-label, maintain-commute, prepare-handoff-drafts.
- reversed operand order with an `argv[1]` truthiness check —
  import-session-bundles, retrieve-maintenance-sources.
- `realpathSync(...) === realpathSync(...)` — ingest-handoff.
- precomputed constants — ingest-file.
- **no guard at all, bare top-level `await main()`** — `wiki/compile-file.ts:210`,
  `commute/validate-session-bundle.ts:102`, `commute/validate-queue.ts:17`,
  `commute/import-handoff.ts:50`.

The missing guards are the direct cause of a testability gap:
`validate-queue.ts`, `validate-session-bundle.ts`, and `import-handoff.ts` have
**no test imports at all**, because importing them executes the command.
`compile-file.ts` and `ingest-file.ts` are tested only by spawning
`node dist/...` subprocesses (`tests/wiki-compile-file.test.ts:109`,
`tests/parser.test.ts:131`), which is slow and cannot exercise error branches
cheaply.

(`recover-session-bundle.ts` is also imported by no test, but for an unrelated
reason — it has no CLI and is covered only indirectly through
`import-session-bundles` recovery cases. Direct coverage for it is worth adding
alongside R3.)

Private-output guards are also inconsistent, which is security-relevant:
`import-session-bundles.ts:661`, `maintain-commute.ts:547`, and
`retrieve-maintenance-sources.ts:339` anchor to the repo-root `.private`
directory, while `feedback-label.ts:653` accepts **any** path containing a
`.private` segment anywhere on the filesystem.

**Change.**

- `src/cli/args.ts` — declarative flag specification (name, kind
  `value|flag|repeatable`, default, required) producing typed options, with one
  missing-value rule, one unknown-argument message, and generated usage text.
- `src/cli/main.ts` — `runAsMain(import.meta.url, main)` used by all ten
  modules, plus uniform error-to-stderr and exit-code handling.
- `src/cli/private-path.ts` — one repo-root-anchored guard used everywhere.

**Behavior change (must be called out in its PR, and needs an OpenSpec change if
it touches a documented command contract):** `--output` for
`record:classifier-feedback` becomes strictly repo-root-anchored, and the loose
parsers begin rejecting `--state --input` instead of silently misreading it.
Both are corrections, but they are observable.

**Payoff.** Each `main()` becomes importable and unit-testable, closing the
coverage gap on four commands without subprocess tests.

### R3. Split `src/commute/session-bundle.ts` (1,079 lines)

The largest file in the repository holds seven distinct responsibilities: enum
and type declarations, whole-bundle validation, the v2 queue contract, artifact
filename rules, canonical-JSON fingerprinting, the playback lifecycle state
machine, and fifteen local primitives.

**Change.** Split into a directory with a barrel that re-exports today's exact
public surface, so no import site changes:

- `session-bundle/types.ts` — enums, interfaces, schema version.
- `session-bundle/queue-v2.ts` — `validateTldrCommuteQueueV2`, item indexing.
  This is imported by `feedback-label.ts` and `recover-session-bundle.ts`, so it
  deserves to be an addressable module rather than a passenger.
- `session-bundle/artifact-filename.ts` — the filename shape, morning/evening
  time rules, and Library-suffix canonicalization.
- `session-bundle/fingerprint.ts` — `canonicalJson`, `queueSnapshotFingerprint`,
  `fileSha256`.
- `session-bundle/events.ts`, `integrity.ts`, `lifecycle.ts`.
- `session-bundle/index.ts` — barrel.

**The highest-value piece is `lifecycle.ts`.** `validateLifecycle`
(`session-bundle.ts:811`, 103 lines) is an implicit state machine driven by three
mutable cursors (`currentItemIndex`, `expectedItemIndex`,
`skipAwaitingNavigation`) whose rules — implicit navigation after `skip`,
announcement recovery for partial bundles, repeat requiring re-announcement —
survive only as prose comments. Rewriting it as an explicit
`transition(state, event) => state | Error` over a named state type makes each
rule individually testable and each comment checkable. This is the part of the
codebase where a subtle regression would be hardest to notice.

Also worth noting: `indexV2Queue` calls `validateQueueItem` and then re-derives
and re-validates `record.playback` a second time
(`session-bundle.ts:307-322` versus `:359-363`). Consolidate during the split.

### R4. Single maintenance-candidate contract

`MaintenanceCandidate` is declared identically and independently in
`src/commute/import-session-bundles.ts:37` and
`src/wiki/retrieve-maintenance-sources.ts:11`. TypeScript's structural typing
means they interoperate silently today and would keep compiling if one gained a
field the other lacks. The two modules also parse the same persisted shape with
different rules: `parsePriorMaintenanceCandidate` uses a field-scoped URL check,
`parseMaintenanceCandidate` uses a different inline one.

**Change.** One `src/commute/maintenance.ts` owning the type, the attempt/result
types, and a single parser; both modules import it. Roughly 60 lines removed and
one whole class of drift eliminated.

### R5. Table-drive the branch-heavy validators

- **`validateEvent`** (`session-bundle.ts:520`, 116 lines) is a seven-arm switch
  in which every arm repeats the base key list
  `['event_id', 'sequence', 'kind', ..., 'evidence']` and re-lists its own
  fields. Replace with a per-kind descriptor (allowed extra keys, field parsers,
  whether direct user-action evidence is required). Adding an event kind becomes
  one table row instead of a new switch arm plus a literal to keep in sync.
- **`validateRecordFields`** (`classifier/validation.ts:218`, 131 lines) runs
  eight sequential `if (!isX) errors.push({...})` blocks, then re-evaluates
  every one of those predicates again in a single eight-clause condition at
  `:327` purely to satisfy narrowing. Replace with a field-spec array and derive
  validity from whether any error was collected. Error codes and messages stay
  identical, so `tests/classifier-validation.test.ts` pins the refactor.
- **Enum chains.** `requireMaintenanceAttemptStatus`
  (`import-session-bundles.ts:552`) is an eight-way `!==` chain and
  `requireMaintainerCandidateStatus` (`maintain-commute.ts:451`) a five-way one;
  both should be `as const` arrays fed to the shared `requireEnum`. Relatedly,
  `feedback-label.ts:21` redeclares `COMMUTE_BEHAVIORS` as a literal list that
  shadows the `CommuteBehavior` union already exported from `routing/derive.ts`
  — a routing-policy value list living outside `src/routing/`.

### R6. Routing decision table

`deriveRouteFromClassification` (`routing/derive.ts:958`) is five near-identical
eight-line object literals selected by nested `if`s over
`interest_level × consumption_depth`. Replace with a
`Record<InterestLevel, Record<ConsumptionDepth, RouteDecision>>` lookup so
`schema/routing-rules.md` maps onto exactly one visible table.

Small in lines, disproportionate in understandability: this is where the
product's entire routing policy lives, and `tests/routing.test.ts` already pins
every cell against a fixture, so the change is close to free.

### R7. Separate wiki Markdown rendering from merge logic — highest risk, sequence last

`src/wiki/compiler.ts` mixes three concerns: provenance merge decisions,
Markdown body assembly, and a hand-rolled frontmatter parser that finds values
by line-prefix scanning (`requireFrontmatterValue`) and `JSON.parse`s three of
them.

`normalizeGeneratedWikiMarkdown` (`compiler.ts:114`) is the least readable code
in the repository: three chained regex passes, one with a multi-alternative
lookahead and a replace callback that inspects `offset` and `input` to decide
trailing newlines. It is also the only code path that can silently corrupt
already-published pages.

**Change.** Extract `wiki/entry-markdown.ts` (frontmatter parse/render, section
assembly) from `wiki/compiler.ts` (merge decisions). Treat normalization as a
parse → transform → render pass over the structured entry rather than regex over
text.

**Sequencing requirement:** add fixture coverage for
`normalizeGeneratedWikiMarkdown`'s current output on real entries _before_
touching it, and land the normalization rewrite as its own PR after the split.
If coverage proves hard to make convincing, keep the existing regexes as-is and
take only the structural split — the split alone is worthwhile.

**Also in scope:** the `person → people` directory mapping exists three times —
`TYPE_DIRECTORIES` (`compiler.ts:4`), `wikiOutputPath` (`compile-file.ts:453`),
and an inline ternary (`ingest-handoff.ts:575`). One exported mapping.

### R8. Shared file-IO and hashing helpers

- `readOptionalFile` — 3 copies (`compile-file.ts`, `ingest-handoff.ts`,
  and the pattern inline elsewhere), two with different `ENOENT` detection.
- JSON writers — 4 variants (`writeJsonExclusive`/`writeJson` in
  `maintain-commute.ts`, `writeJsonFile` in `ingest-file.ts`, inline
  `writeFile(..., { flag: 'wx' })` in four more modules).
- `sha256:`-prefixed digest — 3 copies (`session-bundle.ts:209`,
  `compile-file.ts:458`, `import-session-bundles.ts:301`).
- `readStdin` — 2 identical copies (`feedback-label.ts:717`,
  `ingest-file.ts:154`).
- Atomic state write (temp file + rename) exists once in `compile-file.ts:436`
  and should be the shared way every generated record is written.

→ `src/shared/fs.ts` and `src/shared/hash.ts`.

### R9. Decompose `maintain-commute.ts` `main()`

The 161-line `main()` (`maintain-commute.ts:106`) performs option handling,
bundle loading, intake reconciliation, source retrieval, Git worktree creation,
external agent execution, result parsing, attempt recording, and outcome
writing. Its 25-line `catch` re-derives state the success path already computed —
`prUrl` is resolved three different ways across the two paths
(`agentResult?.pr_url`, `reportedPrUrl`, `readReportedAgentPrUrl`), which is
exactly the shape of bug that produces an inconsistent private record after a
partial failure.

**Change.** Extract sequential steps (`prepareIntake`, `retrieveSources`,
`runMaintainerAgent`, `recordOutcome`) with the intake/outcome bookkeeping in one
place, so success and failure share the recording logic.

Additionally, `buildMaintainerPrompt` (`maintain-commute.ts:74`) is a 25-line
prompt template embedded in orchestration code. Move it to its own module (or a
checked-in template file) so prompt edits are reviewable independently of
control flow. It is already exported and tested, so the move is mechanical.

### R10. Parser data/logic separation

- `isKnownWrapperOrAdLine` (`tldr/parser.ts:521`) hardcodes advertiser-specific
  strings (`'friendli'`, `'> frontier models'`,
  `'coding agents only move'`) inside a 14-clause boolean expression. These are
  data that change with newsletter sponsors; they belong in a named, commented
  constant beside `FOOTER_START_PATTERNS` and `IGNORABLE_LINES`, which already
  follow that pattern.
- `shouldSkipLinkedBlock` (`:488`) — six sequential `if` returns → predicate
  table with a reason label, which would also let review records say _why_ a
  block was skipped.
- `parseTldrEditionBody` (`:81`, 142 lines) — extract the scan-loop body into
  `classifyLine` / `handleLinkBlock` so the mutable cursor and section state are
  visible at one level.

### R11. Documentation consistency pass

Required by the issue; performed alongside the code changes rather than after.

- `AGENTS.md` repository map — add `src/shared/` and `src/cli/` rows.
- `README.md` — module layout references.
- `docs/runtime.md` — any changed CLI validation behavior from R2.
- `chatgpt-project/*.md` and `docs/source-synthesis.md` — only if a documented
  command invocation or error string changes.
- No OpenSpec change file is edited as a refactoring artifact. If R2's guard
  tightening alters a documented command contract, that specific behavior change
  gets its own OpenSpec change, separate from the refactor.

## 3. Sequencing

Each phase is independently mergeable and independently revertible.

- **Phase 1 — foundations, no dependencies between them:** R1, R4, R6, R8.
- **Phase 2 — depends on Phase 1:** R2 (needs `shared/errors` and `shared/fs`),
  R5.
- **Phase 3 — structural:** R3, R9.
- **Phase 4 — highest risk and docs:** R7, R10, R11.

## 4. Validation

For every PR:

- `npm run check` (test, lint, format:check, validate:site) must pass.
- Strict OpenSpec validation for `bootstrap-llm-wiki-mvp` and
  `commute-wiki-operating-loop` when touched requirements are in scope.
- Public exports and thrown error strings stay stable, or every intentional
  change is enumerated in the PR body.
- Behavior-changing items (R2) carry an explicit statement of the old and new
  behavior.

New coverage the plan adds, beyond keeping the 139 existing tests green:

- `tests/shared-validate.test.ts` — the consolidated primitives, including the
  calendar-date and URL cases that currently only one copy handles.
- `tests/cli-args.test.ts` — missing values, unknown flags, repeatable flags,
  and the private-path guard.
- `tests/session-lifecycle.test.ts` — the extracted playback state machine,
  table-driven over the transition rules currently documented only in comments.
- In-process tests for the four CLI `main()` functions that R2 makes importable.

## 5. Explicitly out of scope

- Any change to `schema/` contracts, stored source records under `sources/`, or
  published pages under `wiki/`.
- Any change to `openspec/`.
- Adding a runtime dependency (see the rejected option under R1).
- Behavior changes beyond the two corrections named in R2.
