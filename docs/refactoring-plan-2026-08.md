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

**Alternative: adopt zod instead of hand-rolled primitives.** Measured with a
working spike rather than estimated — see section 2a below for the numbers. Short
version: zod is worth adopting, but for the JSON Schema generation rather than
the line count, and it does not remove the need for R1's structure.

**Guard.** Per the failure-driven-improvements rule, add a focused test (or an
ESLint `no-restricted-syntax` rule) that fails when a module outside
`src/shared/` declares a function named like a shared primitive. Without it the
duplication re-accumulates.

## 2a. Measured evaluation of zod (spike result)

The dependency question was raised and set aside, so the remaining question is
purely how much simpler zod makes the code. This was measured, not estimated: a
faithful zod 4.4 port of `src/commute/handoff.ts` was written and run against
the unmodified `tests/commute-handoff.test.ts`. The spike was then removed; no
zod dependency is committed.

### What the spike showed

| Measure                            | Hand-rolled today | zod port | Delta |
| ---------------------------------- | ----------------- | -------- | ----- |
| Whole module                       | 331               | 208      | -37%  |
| Local validation primitives        | 78                | 0        | -100% |
| Schema/field logic                 | ~179              | ~112     | -37%  |
| Hand-written interfaces            | 33                | 0        | -100% |
| Cross-field invariants             | ~60               | ~60      | ~0    |
| Existing tests passing, unmodified | 9/9               | 7/9      | —     |

Both failing tests were error-message wording, not behavior:
`Unrecognized key: "transcript"` versus the asserted
`unsupported fields: transcript`. Semantics were equivalent in every case.

### Correcting for R1

The 37% headline overstates the incremental gain, because 78 of the 123 removed
lines are the local primitives that **R1 removes anyway, for free, in every
module**. Against a post-R1 baseline the honest comparison is:

- Today: 331 lines.
- After R1 (shared primitives, no zod): ~252 lines.
- After zod: 208 lines.

So zod buys roughly **17-20% beyond R1** on a module that is mostly
straightforward shape validation, plus deletion of the hand-written interfaces.

### Extrapolation across the repository

Only shape validation benefits. Categorizing the 6,723 lines:

| Category                                                                             | LOC     | zod benefit                             |
| ------------------------------------------------------------------------------------ | ------- | --------------------------------------- |
| Shape/field validation (bundle, handoff, approved-source, feedback-label, etc.)      | ~1,500  | ~35% vs today, ~18% vs post-R1          |
| Cross-field domain invariants (integrity rules, correction rules, queue-state rules) | ~400    | ~0 (becomes `superRefine`, same length) |
| Playback lifecycle state machine, fingerprinting, artifact filename rules            | ~170    | none                                    |
| TLDR text scanner (`tldr/parser.ts`)                                                 | 577     | none                                    |
| Wiki Markdown render/merge (`wiki/compiler.ts`, `compile-file.ts`)                   | ~470    | none                                    |
| CLI argument parsing                                                                 | ~335    | none (a parser is still needed first)   |
| Orchestration, IO, types, routing                                                    | balance | none                                    |

Expected saving: roughly **500-600 lines against today (~9% of the codebase)**,
of which R1 already delivers about half without any dependency. Net incremental
saving attributable to zod: **~250-320 lines, under 5%**.

That is a real but modest simplification. The reason it is not larger is
structural: what makes this codebase's validators long is not "is this a
string" — it is the domain invariants, and those stay hand-written either way.

### The strongest argument for zod, which is not line count

`schema/` contains **856 lines of hand-maintained JSON Schema** across six files
that restate contracts the TypeScript validators already enforce:

| File                                       | Lines |
| ------------------------------------------ | ----- |
| `commute-session-bundle-v1.schema.json`    | 337   |
| `commute-handoff-v2.schema.json`           | 135   |
| `approved-wiki-source-v1.schema.json`      | 109   |
| `tldr-commute-queue-v2.schema.json`        | 99    |
| `classifier-feedback-label-v1.schema.json` | 89    |
| `commute-handoff-v1.schema.json`           | 87    |

Every contract therefore exists **twice** in executable form, and nothing keeps
the two in sync. The only guard found in the suite is
`tests/classifier-feedback-label.test.ts:215`, which spot-checks a single `url`
pattern in a single file. The other five files and every other field are
unverified against the code that actually runs.

`z.toJSONSchema()` (confirmed present in zod 4.4) generates these from the
validator, making the schema files build output instead of a parallel
hand-maintained artifact. That removes ~856 lines of drift-prone duplication —
**more than the entire validation-logic saving** — and eliminates a whole class
of defect that no amount of hand-rolled refactoring addresses.

### Costs found in the spike

1. **Error-message wording is a migration cost.** 36 of the 51 `assert.throws`
   calls in the suite assert message patterns. zod's default messages will not
   match, so each schema needs custom messages, clawing back part of the saving.
   This is a one-time cost, not a permanent one.
2. **`exactOptionalPropertyTypes` needs a bridge.** zod emits present-but-
   undefined keys; the repo's interfaces forbid them. A 6-line shared `compact()`
   helper fixes it once, but it must exist.
3. **Discriminated unions change the public type.** Modeling v1/v2 handoffs as
   `z.discriminatedUnion` — the idiomatic choice — makes `z.infer` produce a
   union, and `parsed.queue_states?.[0]` stops compiling at call sites. Verified
   by the spike failing to type-check that way. Modeling it as a single
   `strictObject` with `superRefine` for the version rules preserves today's
   optional-property API and does type-check. Prescribe the latter.
4. **Legacy-lenient parsing is a poor fit.** `recover-session-bundle.ts`
   deliberately accepts malformed historical bundles and coerces positional
   references. Leave it hand-written.

### Recommendation

Adopt zod, with the justification restated: take it for **JSON Schema
generation** (the 856-line duplication), and treat the ~250-320 line validation
saving as a secondary benefit.

This changes R1's shape but does not remove it: `src/shared/` is still needed for
`errorMessage`, the `compact()` bridge, the `formatIssues` translator, and the
shared refinements (safe text, credential-free URL, real calendar date) that
encode this project's actual rules. Sequence it as R1a (shared module, hand-
rolled, unblocks everything) then R1b (zod migration, module by module, with
schema generation) so the two land independently and either can stop early.

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

## 6. Audit of this plan against refactoring practice

Sections 1-5 were written from a duplication-and-line-count reading of the code.
This section audits that plan against the wider set of metrics and against
Martin Fowler's refactoring practice (the smell catalog in _Refactoring_ 2nd ed.
ch. 3, and the workflow guidance in ch. 2 and his "Workflows of Refactoring"
writing). It records where the original plan left gains on the table.

Everything below is measured, not asserted. Section 1 claimed to assess six
quality attributes but only ever measured duplication and LOC; that is the first
finding.

### 6.1 Method gaps (Fowler's discipline, not his catalog)

#### A1. No coverage precondition — the most serious gap

Fowler's precondition for refactoring is self-testing code. The plan asserted
"validated by the existing suite" for every item without ever measuring
coverage. Measured now (`node --test --experimental-test-coverage`): **80.71%
line, 75.09% branch, 89.40% function overall**, distributed almost exactly
opposite to where the plan proposed the largest edits.

| Module                                 | Line % | Func % | Plan item proposing a rewrite |
| -------------------------------------- | ------ | ------ | ----------------------------- |
| `wiki/ingest-handoff.ts`               | 27.66  | 41.67  | R7-adjacent                   |
| `wiki/maintain-commute.ts`             | 38.72  | 65.63  | **R9 (decompose `main()`)**   |
| `wiki/prepare-handoff-drafts.ts`       | 48.86  | 66.67  | R2                            |
| `wiki/retrieve-maintenance-sources.ts` | 53.79  | 65.00  | R2, R4                        |
| `classifier/validation.ts`             | 74.38  | 100.00 | **R5 (rewrite 131-line fn)**  |
| `wiki/approved-source.ts`              | 77.73  | 95.24  | R1                            |
| `routing/derive.ts`                    | 100.00 | 100.00 | R6 (ranked 6th, "very low")   |

R9 is the sharpest case: it proposes restructuring `maintain-commute.ts`'s
161-line `main()`, and coverage reports **lines 41-167 — that entire function —
as uncovered**. Restructuring untested code is not refactoring; it is rewriting
without a net.

**New R0 (must precede R2, R5, R7, R9): characterization tests.** Write tests
that pin current observable behavior of the low-coverage modules _before_
touching them. The risk column in section 2 is wrong and should be recomputed as
complexity × (1 − coverage), not intuition. On that basis R6 is the only item
whose "very low risk" label survives.

#### A2. Big-bang steps where Fowler prescribes small ones

R1 as written changes 11 modules at once. Fowler's central discipline is a
sequence of small behavior-preserving steps with a green suite between each. The
plan should name and prescribe the applicable mechanics:

- **Parallel Change / expand-migrate-contract** for R1 and R1b: add
  `src/shared/`, migrate one module per commit, delete the local copy in that
  same commit, contract only when the last module is migrated.
- **Branch by Abstraction** for R1b specifically, so hand-rolled and zod
  validators coexist while modules move across one at a time.

This is a process correction, not a scope change, but without it R1 is a rewrite
wearing a refactoring label.

#### A3. No functional driver — "make the change easy, then make the easy change"

The plan orders work by duplication count. Fowler orders it by the change you
are about to make. The repository has two live OpenSpec changes
(`bootstrap-llm-wiki-mvp`, `commute-wiki-operating-loop`, journeys J1-J6), and
the plan never asks which refactorings unblock them. Preparatory refactoring
aimed at the next J-journey almost certainly outranks a tidy-up of a module
nobody is about to touch. **This ordering should be revisited against the active
change set before implementation starts**; it is the largest single ROI gap in
the plan and cannot be resolved from the code alone.

#### A4. Refactoring and behavior change conflated

R2 bundles a genuine refactoring with two behavior corrections (the `.private`
guard, the flag-value parsing). Fowler is explicit that these must not share a
commit: a refactoring commit that also changes behavior destroys the property
that makes refactoring safe to review and revert. Land the two fixes as separate
test-first commits before or after the structural change, never inside it.

#### A5. No opportunistic-refactoring practice

The plan is eleven scheduled batches with no standing rule. Fowler's litter-
pickup / comprehension refactoring — improve what you touch, as you touch it —
is what keeps the duplication from re-accumulating between batches. Pair this
with R1's proposed lint guard as a standing convention in `AGENTS.md`.

### 6.2 Smells the plan missed entirely

#### B1. Primitive Obsession — the largest missed reliability gain

Every domain identifier is a bare `string`. Measured declaration counts:

| Identifier           | Declared as `string` |
| -------------------- | -------------------- |
| `source_item_id`     | 12                   |
| `session_id`         | 7                    |
| `event_id`           | 7                    |
| `maintenance_key`    | 6                    |
| `classifier_item_id` | 6                    |

The sha256 fingerprint format is re-validated by regex in **7 places**.

Nothing stops an `event_id` being passed where a `source_item_id` is expected.
That is precisely the failure `validateExactItem`, `maintenanceCandidateKey`,
and `parsePriorMaintenanceAttempt` defend against — **at runtime, with
hand-written checks**. Branded types cost roughly 20 lines:

```ts
declare const brand: unique symbol;
export type SourceItemId = string & { readonly [brand]: 'SourceItemId' };
```

and convert an entire class of runtime validation into a compile error, at zero
runtime cost, under a tsconfig that is already strict enough to enforce it. This
is a bigger reliability win than any item in section 2 and it was absent.

#### B2. Data Clump — `{source_item_id, title, url}`

The same triple is restated in nine types:

`QueueItemIdentity` (the canonical 3-field version), `MaintenanceCandidate`
(twice — see R4), `CommuteFeedback`, `CommuteReviewNote`, `WikiReviewDraft`,
`ClassifierInputItem`, `ParsedTldrItem`, `ClassifierFeedbackLabelInput`, plus
`ExactQueueItem` and `RecoveredWikiCapture` in the recovery path.

`QueueItemIdentity` already exists and **nothing composes with it**. Fowler:
Extract Class / Introduce Parameter Object. Make it the shared nucleus that the
others embed rather than restate. Combined with B1 this is where the type system
starts doing the work the runtime validators currently do by hand.

#### B3. Divergent Change — `feedback-label.ts` is in the wrong package

`src/classifier/feedback-label.ts` (734 lines, 5th-most-churned file) imports
from `commute/session-bundle`, `routing/derive`, **and** `classifier/types`. It
is a cross-cutting feedback workflow living inside the classifier package, and
it creates a package-level cycle: `classifier → routing → classifier`.

It also sits awkwardly against the `AGENTS.md` rule that classifier output stays
source-neutral with routing derived in `src/routing/` — the classifier package
now imports routing policy in order to validate it. Move to `src/feedback/`.

**The plan never questioned module placement at all**, only module contents.
Measured cross-package edges: `wiki → commute` (5), `tldr → routing` (2),
`routing → classifier` (1), `classifier → routing` (1), `classifier → commute`
(1).

#### B4. Shotgun Surgery, measured from history — R4 is badly under-ranked

The plan ranked R4 (single maintenance-candidate contract) fourth, at "~-60 LOC,
low risk", framing it as a tidy-up. Git history says it is the hottest change
axis in the repository:

- `commute/import-session-bundles.ts` is the **most-changed** source file (12
  commits); `wiki/maintain-commute.ts` is **second** (9).
- They are the **most change-coupled pair in the repo** (4 co-changes) — more
  than any other pairing.
- They are exactly the two files that each declare their own copy of
  `MaintenanceCandidate`.

Duplication counts measure how much code exists; change coupling measures where
edits actually land. **R4 should be promoted to the front of Phase 1**: cheap,
low-risk, and aimed precisely at where change concentrates. Runner-up couplings:
`compile-file ↔ compiler` (3, → R7) and `import-session-bundles ↔
recover-session-bundle` (3, → R3).

#### B5. Inconsistent error-handling strategy

`classifier/validation.ts` accumulates every error into a structured
`ClassifierValidationError[]` with a `code` enum. **Every other validating
module throws on the first failure.** For an operator validating a 40-item
session bundle, throw-on-first means fix-one, re-run, repeat.

Fowler's Notification pattern is the named remedy, and it is the strategy
`validation.ts` already uses. The plan should propose one deliberate,
repository-wide answer rather than leaving two conventions in place. This also
strengthens the zod case in section 2a — issue accumulation is native there —
which the zod analysis itself missed.

#### B6. Alternative Classes with Different Interfaces — naming

Four names exist for "non-empty string": `requireString` (×8),
`requireNonEmpty`, `requireNonEmptyString`, `requiredString`. Section 2 counted
these as duplication but never named the vocabulary problem. Consolidation must
also settle on one name (Fowler: Rename Function), or `src/shared/` simply
inherits the confusion.

#### B7. Missing seams — R9 is necessary but not sufficient

Hidden global dependencies, measured (`new Date()` / `process.*` / direct
fs-exec calls):

| Module                         | Dates | `process.*` | IO calls |
| ------------------------------ | ----- | ----------- | -------- |
| `wiki/maintain-commute.ts`     | 3     | 6           | 17       |
| `wiki/ingest-handoff.ts`       | 1     | 5           | 11       |
| `classifier/feedback-label.ts` | 1     | 10          | 7        |
| `wiki/compile-file.ts`         | 1     | 4           | 7        |

R9 says "decompose `main()`" but not _how to make the pieces testable_. The
codebase already contains the right pattern in two places — `retrieveMaintenanceSources`
injects `fetchLike` and `resolveHost`, and `reconcileSessionBundles` injects
`importedAt` — and it was never generalized. Extraction must also **inject the
clock, the filesystem, and the process boundary**, or the extracted functions
stay as untestable as the 161-line original.

#### B8. Speculative Generality (minor)

`ExactQueueItem.position` (`recover-session-bundle.ts:128`) is assigned and
never read — a dead field. Several constants are exported but consumed only
within their declaring module (verified: `COMMUTE_HANDOFF_SCHEMA_VERSION` has no
reader at all; `FORBIDDEN_DOWNSTREAM_FIELDS` and `EVIDENCE_SOURCES` are used
only internally). Narrow the public surface. Low value, near-zero cost.

### 6.3 What the audit does not change

The duplication analysis in R1, the drift evidence, the R3 split, and the R6
decision table all survive. R1 remains correct in substance; the corrections are
that it must be sequenced as a Parallel Change, that it must settle vocabulary
(B6), and that it should carry branded types (B1) and the shared identity type
(B2) with it, since those touch the same call sites.

### 6.4 Revised ordering

| Order | Item                                                     | Why it moved                               |
| ----- | -------------------------------------------------------- | ------------------------------------------ |
| 1     | **R0** characterization tests for <60%-covered modules   | New; precondition for R2, R5, R7, R9       |
| 2     | **R4** single maintenance-candidate contract             | Promoted: highest measured change coupling |
| 3     | **B1+B2** branded ids + shared identity type             | New; rides with R1's call-site edits       |
| 4     | **R1a** shared primitives, as Parallel Change            | Unchanged in substance, resequenced        |
| 5     | **R6** routing table                                     | Only item with 100% coverage               |
| 6     | **B3** move `feedback-label.ts` out of `classifier/`     | New; breaks the package cycle              |
| 7     | R8, R5, R1b (zod + schema generation)                    | Unchanged                                  |
| 8     | R2 (refactor and behavior fixes as separate commits), R3 | Split per A4                               |
| 9     | **B5** one repository-wide error strategy                | New; decide before R1b locks it in         |
| 10    | R9 (with B7 seams), R7, R10, R11                         | R9 now depends on R0                       |

Still open and not resolvable from the code: **A3** — the ordering above should
be re-weighted against whatever J1-J6 work is actually next.
