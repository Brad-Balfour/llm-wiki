# Repository refactoring plan (issue #55)

Status: proposal. Implementation is a follow-on if this plan is accepted.

Scope: the TypeScript implementation under `src/` (6,723 lines, 23 modules) and
`scripts/`. Markdown is in scope only where a code change forces a documentation
update. OpenSpec and other spec-driven-development files are not refactored;
they are the contracts the code must keep satisfying.

## 1. Baseline

Measured at the current `main` content, not estimated.

| Measure              | Value                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Source               | 6,723 lines, 23 modules                                                                                |
| Tests                | 139 passing, `npm run check` green                                                                     |
| Coverage             | 80.71% line, 75.09% branch, 89.40% function                                                            |
| TypeScript           | already strict, incl. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` |
| Lint / format        | ESLint + Prettier, wired into `npm run check`                                                          |
| Runtime dependencies | zero                                                                                                   |

The codebase is in good shape at the type and tooling level. Every problem in
this plan is structural.

Constraints taken from `AGENTS.md` and applied throughout:

- Preserve source provenance, stable identifiers, and idempotence.
- Classifier output stays source-neutral; routing is derived in `src/routing/`.
- No schema or stored-record migration without its own OpenSpec change.
- Bootstrap v1/v2 handoffs and the current compiler remain the runtime default.

## 2. Evidence

Six quality attributes were assessed — DRY, understandability, maintainability,
simplicity, reliability/consistency, and testability — with a measurement behind
each conclusion. Commands to reproduce every figure are in the appendix.

### 2.1 Duplication

The same hand-rolled validation primitives are redeclared across nine modules:

| Primitive              | Copies | Notes                                                      |
| ---------------------- | ------ | ---------------------------------------------------------- |
| `errorMessage`         | 9      | identical three-line body in every case                    |
| object-shape check     | 9      | `requireRecord` / `requireObject` / inline `typeof` blocks |
| non-empty string check | 10     | under four different names (see 2.6)                       |
| `requireEnum`          | 4      |                                                            |
| `rejectUnknownKeys`    | 4      | two different error wordings                               |
| `requireHttpUrl`       | 4      | four different rule sets                                   |
| `stripMarkdownFence`   | 3      |                                                            |
| `requireStringArray`   | 3      |                                                            |
| `requireArray`         | 3      |                                                            |
| `optionalString`       | 3      |                                                            |

The copies have drifted in ways that change behavior:

- `requireHttpUrl` in `session-bundle.ts:1001` catches the `URL` constructor and
  throws a field-scoped message. The copy in `import-session-bundles.ts:533`
  does not, so a malformed prior-record URL surfaces as a raw
  `TypeError: Invalid URL` rather than a contract error naming the field.
  `approved-source.ts:186` adds credential-parameter and Markdown-safety checks
  the others lack; `retrieve-maintenance-sources.ts:320` is a fourth variant.
- Date validation diverges. `feedback-label.ts:529` `validateCalendarDate`
  rejects impossible dates; `session-bundle.ts:982` `requireDate` checks only
  the `YYYY-MM-DD` pattern plus `Date.parse`, which silently rolls over.
  Verified: `Date.parse('2026-02-31T00:00:00Z')` returns a valid timestamp
  (3 March), so an `edition_date` of `2026-02-31` passes bundle validation and
  is rejected by the feedback recorder.
- Wording differs for the same failure: `contains unsupported fields` versus
  `has unknown field(s)`; `must contain unique values` versus
  `must not contain duplicates`.

Every contract tightening is currently a 4-to-10-place edit with nothing
keeping the places in sync.

### 2.2 Test coverage

Coverage is uneven, and thinnest exactly where the largest structural changes
are worth making.

| Module                                 | Line % | Function % |
| -------------------------------------- | ------ | ---------- |
| `wiki/ingest-handoff.ts`               | 27.66  | 41.67      |
| `wiki/maintain-commute.ts`             | 38.72  | 65.63      |
| `wiki/prepare-handoff-drafts.ts`       | 48.86  | 66.67      |
| `wiki/retrieve-maintenance-sources.ts` | 53.79  | 65.00      |
| `classifier/validation.ts`             | 74.38  | 100.00     |
| `wiki/approved-source.ts`              | 77.73  | 95.24      |
| `classifier/feedback-label.ts`         | 81.52  | 88.37      |
| `commute/session-bundle.ts`            | 86.66  | 92.31      |
| `routing/derive.ts`                    | 100.00 | 100.00     |

`maintain-commute.ts` lines 41-167 — its entire 161-line `main()` — are
uncovered. Restructuring untested code is rewriting, not refactoring, so
coverage is a precondition rather than a nice-to-have (item 1).

### 2.3 Change coupling and churn

Duplication counts show how much code exists; git history shows where edits
actually land.

Most-changed source files: `commute/import-session-bundles.ts` (12 commits),
`wiki/maintain-commute.ts` (9), `wiki/compiler.ts` (7),
`commute/session-bundle.ts` (6), `classifier/feedback-label.ts` (6).

Most change-coupled pairs:

| Pair                                                      | Co-changes |
| --------------------------------------------------------- | ---------- |
| `import-session-bundles.ts` ↔ `maintain-commute.ts`       | 4          |
| `compile-file.ts` ↔ `compiler.ts`                         | 3          |
| `import-session-bundles.ts` ↔ `recover-session-bundle.ts` | 3          |
| `maintain-commute.ts` ↔ `retrieve-maintenance-sources.ts` | 2          |

The top pair is also the top-two churn files, and they are exactly the two
modules that each declare their own copy of `MaintenanceCandidate`. That makes
the maintenance-candidate contract the single hottest change axis in the
repository and moves it to the front of the plan (item 2).

### 2.4 Type-level modelling

Domain identifiers are all bare `string`:

| Identifier           | Declarations as `string` |
| -------------------- | ------------------------ |
| `source_item_id`     | 12                       |
| `session_id`         | 7                        |
| `event_id`           | 7                        |
| `maintenance_key`    | 6                        |
| `classifier_item_id` | 6                        |

The sha256 fingerprint format is re-validated by regex in 7 places. Nothing
prevents passing an `event_id` where a `source_item_id` is expected — which is
precisely what `validateExactItem`, `maintenanceCandidateKey`, and
`parsePriorMaintenanceAttempt` defend against at runtime, by hand.

The triple `{source_item_id, title, url}` is restated in nine types:
`QueueItemIdentity`, `MaintenanceCandidate` (twice), `CommuteFeedback`,
`CommuteReviewNote`, `WikiReviewDraft`, `ClassifierInputItem`,
`ParsedTldrItem`, `ClassifierFeedbackLabelInput`, plus `ExactQueueItem` and
`RecoveredWikiCapture` in the recovery path. `QueueItemIdentity` is already the
canonical three-field version and nothing composes with it.

### 2.5 Module boundaries

Cross-package import edges: `wiki → commute` (5), `tldr → routing` (2),
`routing → classifier` (1), `classifier → routing` (1), `classifier → commute`
(1).

`classifier/feedback-label.ts` (734 lines, 5th-most-churned) imports from
`commute/session-bundle`, `routing/derive`, and `classifier/types`. It is a
cross-cutting feedback workflow living inside the classifier package, it creates
a package-level cycle `classifier → routing → classifier`, and it means the
classifier package imports routing policy in order to validate it — in tension
with the `AGENTS.md` rule that routing stays derived in `src/routing/`.

### 2.6 Consistency

- **Four names for one concept.** `requireString` (×8), `requireNonEmpty`,
  `requireNonEmptyString`, `requiredString`.
- **Two error strategies.** `classifier/validation.ts` accumulates every error
  into a structured `ClassifierValidationError[]` with a `code` enum; every
  other validating module throws on the first failure. For an operator
  validating a 40-item session bundle, throw-on-first means fix one, re-run,
  repeat.
- **Five entrypoint guards.** Four distinct `import.meta.url` comparisons, plus
  four modules with a bare top-level `await main()` — `wiki/compile-file.ts:210`,
  `commute/validate-session-bundle.ts:102`, `commute/validate-queue.ts:17`,
  `commute/import-handoff.ts:50`. Importing those executes the command, which is
  why `validate-queue`, `validate-session-bundle`, and `import-handoff` have no
  test imports at all.
- **Four `.private` guards, two semantics.** `import-session-bundles.ts:661`,
  `maintain-commute.ts:547`, and `retrieve-maintenance-sources.ts:339` anchor to
  the repo-root `.private` directory; `feedback-label.ts:653` accepts any path
  containing a `.private` segment anywhere on the filesystem.
- **Ten hand-rolled argument parsers** (~335 lines) with four incompatible
  missing-value behaviours. Traced: `compile:wiki -- --input a --state
--confirm-public` sets `statePath` to the literal string `--confirm-public`,
  consumes it, then fails complaining `--confirm-public` is missing.

### 2.7 Hidden global dependencies

Counts of `new Date()` / `process.*` / direct fs-exec calls:

| Module                         | Dates | `process.*` | IO  |
| ------------------------------ | ----- | ----------- | --- |
| `wiki/maintain-commute.ts`     | 3     | 6           | 17  |
| `wiki/ingest-handoff.ts`       | 1     | 5           | 11  |
| `classifier/feedback-label.ts` | 1     | 10          | 7   |
| `wiki/compile-file.ts`         | 1     | 4           | 7   |

The codebase already contains the right pattern in two places —
`retrieveMaintenanceSources` injects `fetchLike` and `resolveHost`,
`reconcileSessionBundles` injects `importedAt` — and it was never generalized.

### 2.8 Duplicated contracts outside the code

`schema/` holds **856 lines of hand-maintained JSON Schema** across six files
restating contracts the TypeScript validators already enforce:

| File                                       | Lines |
| ------------------------------------------ | ----- |
| `commute-session-bundle-v1.schema.json`    | 337   |
| `commute-handoff-v2.schema.json`           | 135   |
| `approved-wiki-source-v1.schema.json`      | 109   |
| `tldr-commute-queue-v2.schema.json`        | 99    |
| `classifier-feedback-label-v1.schema.json` | 89    |
| `commute-handoff-v1.schema.json`           | 87    |

Every contract exists twice in executable form and nothing keeps the two in
sync. The only guard in the suite is `tests/classifier-feedback-label.test.ts:215`,
which spot-checks a single `url` pattern in one of the six files.

## 3. Working discipline

These rules apply to every item and are as much a part of the plan as the items
themselves.

1. **Coverage before restructuring.** No module below ~60% coverage is
   restructured until characterization tests pin its current behavior.
2. **Refactoring never changes behavior.** Where a change is a correction rather
   than a restructuring, it lands as its own test-first commit, before or after
   the refactor, never inside it.
3. **Parallel Change, not big bang.** Shared modules are introduced by adding
   the new implementation, migrating one module per commit (deleting that
   module's local copy in the same commit), and contracting only once the last
   caller has moved. No commit touches eleven modules.
4. **Green between every step.** `npm run check` passes on each commit, not only
   at the end of a phase.
5. **Public exports and error strings stay stable**, or every intentional change
   is enumerated in the PR body.
6. **Litter-pickup as standing practice.** Improve what you touch as you touch
   it, so duplication does not re-accumulate between phases. Worth adding to
   `AGENTS.md` alongside the guard in item 4.

## 4. The plan

Ordered by measured return on investment: change coupling and churn first, then
duplication, weighted against risk computed as complexity × (1 − coverage).

| #   | Item                                          | Location                              | Extent                  | Risk     |
| --- | --------------------------------------------- | ------------------------------------- | ----------------------- | -------- |
| 1   | Characterization tests                        | 4 low-coverage modules                | tests only              | None     |
| 2   | Single maintenance-candidate contract         | `commute/`, `wiki/`                   | ~-60 LOC                | Low      |
| 3   | Branded identifiers + shared identity type    | ~10 modules                           | ~+40 LOC                | Low      |
| 4   | Shared validation primitives                  | new `src/shared/`, 11 modules         | ~-500 / +220 LOC        | Low-med  |
| 5   | Routing decision table                        | `routing/derive.ts`                   | ~-30 LOC                | Very low |
| 6   | Move `feedback-label.ts` out of `classifier/` | new `src/feedback/`                   | file move               | Low      |
| 7   | Shared file-IO and hashing helpers            | `src/shared/`, 8 modules              | ~-90 LOC                | Low      |
| 8   | Table-drive branch-heavy validators           | `session-bundle.ts`, `validation.ts`  | ~-150 LOC               | Low-med  |
| 9   | One error-handling strategy                   | all validating modules                | decision + apply        | Medium   |
| 10  | zod migration + JSON Schema generation        | validators, `schema/`                 | ~-250 code, -856 schema | Medium   |
| 11  | Unified CLI entrypoint layer                  | new `src/cli/`, 10 modules            | ~-200 LOC               | Medium   |
| 12  | Split `commute/session-bundle.ts`             | 1 file → 8                            | 1,079 LOC moved         | Low      |
| 13  | Decompose `maintain-commute.ts` `main()`      | `wiki/maintain-commute.ts`            | 161-line fn             | Medium   |
| 14  | Separate wiki Markdown rendering from merge   | `wiki/compiler.ts`, `compile-file.ts` | ~260 LOC split          | High     |
| 15  | Parser data/logic separation                  | `tldr/parser.ts`                      | ~-40 LOC                | Low      |
| 16  | Narrow public surface, remove dead members    | several                               | ~-20 LOC                | Very low |
| 17  | Documentation consistency pass                | `README.md`, `AGENTS.md`, `docs/`     | docs only               | Very low |

### 1. Characterization tests — precondition for items 11, 13, 14

Pin current observable behavior of `wiki/ingest-handoff.ts` (27.66%),
`wiki/maintain-commute.ts` (38.72%), `wiki/prepare-handoff-drafts.ts` (48.86%),
and `wiki/retrieve-maintenance-sources.ts` (53.79%) before anything restructures
them. Target the uncovered branches specifically, not the coverage percentage.

For `maintain-commute.ts` this means covering the orchestration in `main()`
(lines 41-167) at least at the level of its success path, its agent-failure
path, and its no-retrievable-sources path.

### 2. Single maintenance-candidate contract

`MaintenanceCandidate` is declared identically and independently in
`commute/import-session-bundles.ts:37` and
`wiki/retrieve-maintenance-sources.ts:11`. Structural typing means they
interoperate silently today and would keep compiling if one gained a field the
other lacked. The two modules also parse the same persisted shape with different
rules: `parsePriorMaintenanceCandidate` uses a field-scoped URL check,
`parseMaintenanceCandidate` a different inline one.

**Change.** One `src/commute/maintenance.ts` owning the type, the attempt and
result types, and a single parser; both modules import it.

**Why first.** These are the two most-changed files in the repository and its
most change-coupled pair. Cheap, low-risk, and aimed precisely at where edits
concentrate.

### 3. Branded identifiers and a shared identity type

**Branded ids.** Roughly 20 lines:

```ts
declare const brand: unique symbol;
export type SourceItemId = string & { readonly [brand]: 'SourceItemId' };
```

applied to `source_item_id`, `session_id`, `event_id`, `maintenance_key`,
`classifier_item_id`, and the `sha256:` fingerprint. This converts a class of
runtime validation into compile errors at zero runtime cost, under a tsconfig
already strict enough to enforce it.

**Shared identity type.** Make `QueueItemIdentity` the nucleus that the other
nine types embed rather than restate.

**Why here.** Both touch the same call sites as item 4, so they ride along with
that migration instead of causing a second sweep.

### 4. Shared validation primitives

Add `src/shared/`:

- `validate.ts` — `requireRecord`, `requireString`, `requireEnum`,
  `requireArray`, `requireStringArray`, `requirePositiveInteger`,
  `requireScore`, `requireUniqueStrings`, `rejectUnknownKeys`, `optionalString`.
- `url.ts` — one `requireHttpUrl(value, field, options)` with explicit flags
  (`protocols`, `rejectCredentials`, `markdownSafe`, `rejectCredentialParams`)
  so each caller declares the strictness it needs.
- `time.ts` — `requireDate` on real-calendar-date semantics (adopt the stricter
  `feedback-label` behavior everywhere), `requireDateTime`, `requireIsoTimestamp`.
- `json.ts` — `stripMarkdownFence`, `parseJsonObject`.
- `errors.ts` — `errorMessage`, `errorCode`, `isMissingFile`, `isExistingFile`.

**Settle the vocabulary.** One name per concept, or `src/shared/` inherits the
confusion documented in 2.6. Recommend `requireString` for the non-empty string
check, since it already has eight of the eleven usages.

**Error strings.** These are effectively an operator-facing contract and several
tests assert them. Normalize on one wording per failure class and update the
asserting tests in the same commit, listing each changed message in the PR body.

**Sequencing.** Parallel Change, one module per commit, per rule 3.

**Guard.** Add a focused test or an ESLint `no-restricted-syntax` rule that
fails when a module outside `src/shared/` declares a primitive that now lives
there. Without it the duplication re-accumulates.

### 5. Routing decision table

`deriveRouteFromClassification` (`routing/derive.ts:958`) is five near-identical
eight-line object literals selected by nested `if`s over
`interest_level × consumption_depth`. Replace with a
`Record<InterestLevel, Record<ConsumptionDepth, RouteDecision>>` lookup, so
`schema/routing-rules.md` maps onto exactly one visible table.

Small in lines, disproportionate in understandability — this is where the
product's whole routing policy lives — and it is the only module in the
repository at 100% line, branch, and function coverage, so the change is close
to free.

### 6. Move `feedback-label.ts` out of `classifier/`

Move to `src/feedback/`, breaking the `classifier → routing → classifier`
package cycle and removing the tension with the source-neutrality rule described
in 2.5. Mechanical: a file move plus import updates, no logic change.

### 7. Shared file-IO and hashing helpers

- `readOptionalFile` — 3 copies, two with different `ENOENT` detection.
- JSON writers — 4 variants (`writeJsonExclusive` / `writeJson` /
  `writeJsonFile` / inline `writeFile(..., { flag: 'wx' })` in four modules).
- `sha256:`-prefixed digest — 3 copies (`session-bundle.ts:209`,
  `compile-file.ts:458`, `import-session-bundles.ts:301`).
- `readStdin` — 2 identical copies.
- Atomic state write (temp file + rename) exists once in `compile-file.ts:436`
  and should become the shared way every generated record is written.

→ `src/shared/fs.ts`, `src/shared/hash.ts`.

### 8. Table-drive the branch-heavy validators

- **`validateEvent`** (`session-bundle.ts:520`, 116 lines): a seven-arm switch in
  which every arm repeats the base key list and re-lists its own fields. Replace
  with a per-kind descriptor (allowed extra keys, field parsers, evidence
  requirement) so adding an event kind is one table row.
- **`validateRecordFields`** (`classifier/validation.ts:218`, 131 lines): eight
  sequential `if (!isX) errors.push({...})` blocks, then every one of those
  predicates re-evaluated in a single eight-clause condition at `:327` purely to
  satisfy narrowing. Replace with a field-spec array and derive validity from
  collected errors. Error codes and messages stay identical.
- **Enum chains**: `requireMaintenanceAttemptStatus` (8-way `!==` chain) and
  `requireMaintainerCandidateStatus` (5-way) become `as const` arrays fed to the
  shared `requireEnum`. Relatedly `feedback-label.ts:21` redeclares
  `COMMUTE_BEHAVIORS` as a literal list shadowing the `CommuteBehavior` union
  already exported from `routing/derive.ts` — a routing value list living
  outside `src/routing/`.

Note `indexV2Queue` calls `validateQueueItem` and then re-derives and
re-validates `record.playback` a second time (`:307-322` versus `:359-363`);
consolidate here.

### 9. One error-handling strategy

Decide, repository-wide, between throw-on-first and accumulate-all, and apply it
consistently. Recommendation is accumulate-all (Fowler's Notification pattern),
which `classifier/validation.ts` already implements and which is materially
better for an operator validating a large bundle.

**Decide before item 10**, because the zod migration will otherwise bake in
whichever convention each module happens to have.

### 10. zod migration and JSON Schema generation

Measured with a working spike rather than estimated: a faithful zod 4.4 port of
`commute/handoff.ts` run against the unmodified `tests/commute-handoff.test.ts`.

| Measure                            | Hand-rolled | zod | Delta |
| ---------------------------------- | ----------- | --- | ----- |
| Whole module                       | 331         | 208 | -37%  |
| Local validation primitives        | 78          | 0   | -100% |
| Hand-written interfaces            | 33          | 0   | -100% |
| Cross-field invariants             | ~60         | ~60 | ~0    |
| Existing tests passing, unmodified | 9/9         | 7/9 | —     |

Both failures were message wording (`Unrecognized key: "transcript"` versus the
asserted `unsupported fields: transcript`); semantics were equivalent in every
case.

**The 37% overstates the incremental gain**, because 78 of the 123 removed lines
are the local primitives item 4 removes anyway. Against a post-item-4 baseline:
331 → ~252 → 208, so zod buys roughly 17-20% beyond the hand-rolled
consolidation.

Extrapolated across the repository — ~1,500 lines of shape validation benefit at
~35%; ~400 lines of cross-field invariants benefit ~0 (they become `superRefine`
at the same length); and the TLDR text scanner (577), the Markdown compiler
(~470), the playback state machine, fingerprinting and CLI parsing (~335)
benefit not at all — the net saving attributable to zod is **~250-320 lines,
under 5% of the codebase**.

**Schema generation is the main argument, but it is narrower than first
claimed.** `z.toJSONSchema()` (confirmed present in zod 4.4) can generate the
six `schema/*.schema.json` files from the validators, turning ~856 lines of
unguarded duplication into build output.

**Correction, from review of this plan (#56).** Generation covers _structural_
rules only. Cross-field constraints expressed as `superRefine` are **silently
dropped** — no error, no warning — so a generated schema is more permissive than
both the validator and the hand-written schema it would replace. Verified:

```
runtime validator rejects {queue_file:'q', status:'partial'}   -> true
generated schema "required"                                    -> ["queue_file","status"]
=> the generated schema accepts what the validator rejects
```

This is not hypothetical. Three of the six schemas encode exactly these rules:

| Schema                                  | `if`/`then` blocks | `oneOf` |
| --------------------------------------- | ------------------ | ------- |
| `commute-handoff-v2.schema.json`        | 4                  | 0       |
| `commute-session-bundle-v1.schema.json` | 2                  | 1       |
| `commute-handoff-v1.schema.json`        | 1                  | 0       |

Naive generation would quietly weaken seven conditional rules and one `oneOf`,
including `status: partial` requiring `resume_source_item_id`. That is a
contract regression wearing a refactoring label.

**Costs found in the spike:**

1. 36 of the 51 `assert.throws` calls in the suite assert message patterns; each
   schema needs custom messages. One-time cost.
2. `exactOptionalPropertyTypes` needs a bridge — zod emits present-but-undefined
   keys the interfaces forbid. A 6-line shared `compact()` helper, written once.
3. Do **not** model v1/v2 handoffs as `z.discriminatedUnion`. Verified: `z.infer`
   then produces a union and `parsed.queue_states?.[0]` stops compiling at call
   sites. A single `strictObject` with `superRefine` for the version rules
   preserves today's API and type-checks clean.
4. `recover-session-bundle.ts` deliberately accepts malformed historical bundles
   and coerces positional references. Leave it hand-written.
5. Generated schemas lose every cross-field constraint, as above.

**Revised recommendation.** The original problem was never "the schemas are
hand-written" — it was that they are **unguarded** duplicates, with one partial
check across six files. Generation is one way to close that; it is not the only
way, and on its own it trades a duplication problem for a weaker-contract
problem.

Take them in this order, and stop as soon as the duplication is guarded:

1. **First, and independent of zod: a conformance test.** Run the hand-written
   JSON Schema and the TypeScript validator over a shared corpus of valid and
   invalid fixtures, and assert they agree on every accept/reject. This closes
   the actual defect — silent drift between the two — at a fraction of the cost,
   preserves every conditional rule, and is worth doing whether or not zod is
   ever adopted. It also gives any later migration a safety net.
2. **Then, optionally, zod for the validators**, taken for the ~250-320 line
   saving on its own merits rather than for schema generation.
3. **Generation only where a schema has no cross-field rules.**
   `classifier-feedback-label-v1` and `tldr-commute-queue-v2` have none and
   could be generated safely. The other four keep their hand-authored
   conditional sections, with the conformance test from step 1 as the guard.

This does not remove item 4 — `src/shared/` is still needed for `errorMessage`,
the `compact()` bridge, the issue-to-message translator, and the refinements
encoding this project's actual rules (safe text, credential-free URL, real
calendar date).

### 11. Unified CLI entrypoint layer

**Change.**

- `src/cli/args.ts` — declarative flag specification (name, kind
  `value|flag|repeatable`, default, required) producing typed options, with one
  missing-value rule, one unknown-argument message, and generated usage text.
- `src/cli/main.ts` — `runAsMain(import.meta.url, main)` for all ten modules,
  plus uniform error-to-stderr and exit-code handling.
- `src/cli/private-path.ts` — one repo-root-anchored guard.

**Payoff.** Each `main()` becomes importable and unit-testable, closing the
coverage gap on four commands without subprocess tests. Today `compile-file.ts`
and `ingest-file.ts` are testable only by spawning `node dist/...`
(`tests/wiki-compile-file.test.ts:109`, `tests/parser.test.ts:131`).

**Two behavior corrections, landing as separate commits per rule 2:** the
`feedback-label` `--output` guard becomes repo-root-anchored, and the loose
parsers begin rejecting `--state --confirm-public` instead of misreading it.
Both are fixes, but they are observable, and if either touches a documented
command contract it needs its own OpenSpec change.

### 12. Split `commute/session-bundle.ts`

The largest file in the repository holds seven responsibilities. Split into a
directory with a barrel re-exporting today's exact public surface, so no import
site changes:

`types.ts`, `queue-v2.ts` (also imported by `feedback-label` and
`recover-session-bundle`, so it deserves to be addressable),
`artifact-filename.ts`, `fingerprint.ts`, `events.ts`, `integrity.ts`,
`lifecycle.ts`, `index.ts`.

**The highest-value piece is `lifecycle.ts`.** `validateLifecycle` (`:811`, 103
lines) is an implicit state machine driven by three mutable cursors
(`currentItemIndex`, `expectedItemIndex`, `skipAwaitingNavigation`) whose rules —
implicit navigation after `skip`, announcement recovery for partial bundles,
repeat requiring re-announcement — survive only as prose comments. Rewriting it
as an explicit `transition(state, event) => state | Error` over a named state
type makes each rule individually testable and each comment checkable. This is
where a subtle regression would be hardest to notice.

Add direct coverage for `recover-session-bundle.ts` here; it currently has no
test imports and is exercised only indirectly.

### 13. Decompose `maintain-commute.ts` `main()`

The 161-line `main()` (`:106`) performs option handling, bundle loading, intake
reconciliation, source retrieval, worktree creation, agent execution, result
parsing, attempt recording, and outcome writing. Its 25-line `catch` re-derives
state the success path already computed — `prUrl` is resolved three different
ways across the two paths — which is the shape of bug that produces an
inconsistent private record after a partial failure.

**Change.** Extract sequential steps (`prepareIntake`, `retrieveSources`,
`runMaintainerAgent`, `recordOutcome`) so success and failure share the
bookkeeping, **and inject the clock, filesystem, and process boundary** (2.7).
Extraction without injection leaves the pieces as untestable as the original.

Also move `buildMaintainerPrompt` (`:74`, a 25-line prompt template embedded in
orchestration code) to its own module or a checked-in template file, so prompt
edits are reviewable independently of control flow. It is already exported and
tested, so the move is mechanical.

Depends on item 1.

### 14. Separate wiki Markdown rendering from merge logic — highest risk

`wiki/compiler.ts` mixes provenance merge decisions, Markdown body assembly, and
a hand-rolled frontmatter parser that finds values by line-prefix scanning.

`normalizeGeneratedWikiMarkdown` (`:114`) is the least readable code in the
repository — three chained regex passes, one with a multi-alternative lookahead
and a replace callback inspecting `offset` and `input` — and the only code path
that can silently corrupt already-published pages.

**Change.** Extract `wiki/entry-markdown.ts` (frontmatter parse/render, section
assembly) from `wiki/compiler.ts` (merge decisions). Treat normalization as a
parse → transform → render pass rather than regex over text.

**Sequencing requirement.** Add fixture coverage for
`normalizeGeneratedWikiMarkdown`'s current output on real entries _before_
touching it, and land the normalization rewrite as its own PR after the split.
If that coverage cannot be made convincing, keep the existing regexes and take
only the structural split — the split alone is worthwhile.

**Also here:** the `person → people` directory mapping exists three times —
`TYPE_DIRECTORIES` (`compiler.ts:4`), `wikiOutputPath` (`compile-file.ts:453`),
and an inline ternary (`ingest-handoff.ts:575`).

### 15. Parser data/logic separation

- `isKnownWrapperOrAdLine` (`tldr/parser.ts:521`) hardcodes advertiser-specific
  strings (`'friendli'`, `'> frontier models'`, `'coding agents only move'`)
  inside a 14-clause boolean expression. These are data that change with
  newsletter sponsors and belong in a named constant beside
  `FOOTER_START_PATTERNS` and `IGNORABLE_LINES`, which already follow that
  pattern.
- `shouldSkipLinkedBlock` (`:488`) — six sequential `if` returns → predicate
  table with a reason label, which would also let review records say _why_ a
  block was skipped.
- `parseTldrEditionBody` (`:81`, 142 lines) — extract the scan-loop body into
  `classifyLine` / `handleLinkBlock` so the mutable cursor and section state are
  visible at one level.

### 16. Narrow the public surface

`ExactQueueItem.position` (`recover-session-bundle.ts:128`) is assigned and
never read. Several constants are exported but consumed only within their
declaring module — verified: `COMMUTE_HANDOFF_SCHEMA_VERSION` has no reader at
all; `FORBIDDEN_DOWNSTREAM_FIELDS` and `EVIDENCE_SOURCES` are used only
internally. Low value, near-zero cost, worth doing as litter-pickup rather than
as its own PR.

### 17. Documentation consistency pass

Performed alongside the code changes rather than after.

- `AGENTS.md` repository map — add `src/shared/`, `src/cli/`, `src/feedback/`;
  add the litter-pickup convention from rule 6.
- `README.md` — module layout references.
- `docs/runtime.md` — any changed CLI validation behavior from item 11.
- `chatgpt-project/*.md`, `docs/source-synthesis.md` — only if a documented
  command invocation or error string changes.
- No OpenSpec change file is edited as a refactoring artifact. Behavior changes
  get their own OpenSpec change, separate from the refactor.

## 5. Phasing

Each phase is independently mergeable and independently revertible.

| Phase | Items              | Character                                       |
| ----- | ------------------ | ----------------------------------------------- |
| 1     | 1, 2, 3, 4, 5, 6   | Safety net, then highest-coupling and DRY wins  |
| 2     | 7, 8, 9, 10        | Consolidation and the zod/schema decision       |
| 3     | 11, 12             | Structural; 11 carries its behavior fixes apart |
| 4     | 13, 14, 15, 16, 17 | Highest risk last, docs alongside               |

## 6. Validation

Per PR:

- `npm run check` (test, lint, format:check, validate:site) passes.
- Strict OpenSpec validation for `bootstrap-llm-wiki-mvp` and
  `commute-wiki-operating-loop` when touched requirements are in scope.
- Public exports and error strings stable, or changes enumerated in the body.
- Coverage does not regress on the touched module.

New coverage this plan adds, beyond keeping the 139 existing tests green:

- Characterization tests for the four modules under 60% (item 1).
- `tests/shared-validate.test.ts` — the consolidated primitives, including the
  calendar-date and URL cases only one copy currently handles.
- `tests/cli-args.test.ts` — missing values, unknown flags, repeatable flags,
  and the private-path guard.
- `tests/session-lifecycle.test.ts` — the extracted playback state machine,
  table-driven over rules currently documented only in comments.
- Direct coverage for `recover-session-bundle.ts`.
- In-process tests for the four CLI `main()` functions item 11 makes importable.

## 7. Out of scope

- Any change to `schema/` contracts, stored source records under `sources/`, or
  published pages under `wiki/`. (Item 10 changes how the `schema/*.schema.json`
  files are _produced_, not what they assert.)
- Any change to `openspec/`.
- Behavior changes beyond the two corrections named in item 11.

## Appendix: reproducing the measurements

```sh
# Source size
find src -name '*.ts' | xargs wc -l | tail -1

# Coverage
npm run build && node --test --experimental-test-coverage dist/tests/*.test.js

# Churn
git log --format='' --name-only -- 'src/*.ts' | sort | uniq -c | sort -rn

# Change coupling (files changed in the same commit)
git log --format='%H' --name-only -- 'src/*.ts' |
  awk 'NF==0{if(n>1)for(i=1;i<=n;i++)for(j=i+1;j<=n;j++){a=f[i];b=f[j];
      if(a>b){t=a;a=b;b=t}print a" <-> "b}; n=0; next} /^src\//{f[++n]=$0}' |
  sort | uniq -c | sort -rn

# Duplicated primitives
grep -rc "function errorMessage" src --include=*.ts | grep -v ':0'

# Cross-package edges
grep -rn "from '\.\./" src --include=*.ts

# Hand-maintained JSON Schema
wc -l schema/*.schema.json
```
