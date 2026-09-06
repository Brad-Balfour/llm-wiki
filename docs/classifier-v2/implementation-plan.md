# Classifier v2 implementation and validation plan

Status: proposed; this PR contains planning only. The
[requirements](requirements.md) define R1–R10 and the
[evidence inventory](evidence-inventory.md) accounts for every open issue.
No model experiment, live Project edit, mailbox change, or implementation rollout
has happened as part of this plan.

## Recommended sequence

Ship diagnostics and trustworthy replay first. Keep Monday's existing queue
producer available. Build and evaluate a reproducible control on old newsletters,
then promote one measured scoring change. Add day-level exact deduplication and
short-playback improvements as separately reviewable product changes. Retain
stock iPhone Voice; its enforcement problem is a distinct acceptance track.

This provides incremental value before the four-week scoring experiment ends:
missing-item explanations, reliable version binding, reusable labeled data,
deterministic queue checks, and eventually fewer duplicate announcements. It
does not require Brad to approve a monolithic replacement pipeline.

## Monday, September 7, 2026

The first priority is a usable commute, not declaring a newly trained v2 ready.
The current Task is recorded as weekdays at 11:00 AM America/New_York. This is
an afternoon-queue path; it cannot promise Monday morning's new editions.

1. Before Monday, preserve available historical **sanitized item-level** data and
   inventory the baseline configuration. Do not wait four weeks while messages
   remain in Trash. Search results already establish available candidate IDs;
   body confirmation and extraction are the next implementation steps.
2. Keep current profile 1.4, classifier instructions v1, routing v1, queue v3,
   Voice Prompt 4.2 and export source in the live Project. Do not introduce a
   partial schema migration before a drive.
3. On Monday after delivery, inspect actual editions and downloads. Do not
   presume Fintech publishes, that every edition has arrived by 11 AM, or that a
   weekday Task notification means success. If no fresh edition arrives, report
   that and offer an explicitly dated existing queue; never rename old data as
   September 7.
4. If scheduled output fails, use the documented manual request in the **same**
   `LLM-Wiki-Car` Project, accessible from the phone:

   ```text
   Generate TLDR v3 commute queues for emails delivered on September 7, 2026.
   Use the attached tldr-commute-queue-v3.schema.json and the Project's v3 queue
   instructions. Create real downloadable files only.
   ```

5. Check real downloads, edition coverage and identity. Agent-side local
   validation, when available, uses the existing command:

   ```sh
   npm run validate:commute-queue -- /absolute/path/20260907-tldr.txt
   ```

   Repeat for each supplied edition. Local validation is not yet an unattended
   phone-side enforcement mechanism. A failed file must be regenerated with the
   same baseline sources; do not silently patch its scores, label provenance or
   date to make it pass. Keep any valid editions independently usable and report
   the missing/failed ones. A sparse queue triggers full-candidate inspection,
   not an invented minimum item count.

6. If the diagnostic sidecar PR has already passed review and a manual control,
   collect its private manifest alongside baseline output. Otherwise retain the
   Monday input as a named replay run once that tool exists. **Neither blocks
   the commute.** Do not attach experimental candidate queues under the live
   filenames or silently feed Monday corrections into the profile.
7. Capture exact corrections and separate playback incidents after the commute.
   Monday heard material is development/weekly evidence, not an untouched final
   holdout. If Monday is chosen as a locked test, freeze predictions and label
   blind before showing candidate predictions; default to later unseen dates
   for the final lock so the commute is not delayed.

No wakeup, recurring task change, or promised Monday execution is created by this
planning document. Those are rollout actions after the corresponding PR review.

## Architecture and contracts

```text
Current operational path:
Gmail -> same ChatGPT Project producer -> dated queue-v3 files -> iPhone Voice
                                              -> session bundles -> maintainer PR

Proposed reproducible control:
confirmed email/body stream -> parser + source inventory -> URL canonicalizer
  -> private full-candidate manifest -> frozen sanitized classifier inputs
  -> configured scorer -> existing strict validator -> application routing
  -> optional day-level exact reducer -> deterministic queue-v3 renderer
  -> offline validator + run report

Data for improvement:
exact queue + user words -> evidence adjudication -> private label corpus
  -> blind development/weekly/final splits -> baseline/candidate comparison
  -> reviewed promotion decision
```

The Project remains the operational producer until an end-to-end replacement
passes delivery acceptance. Initially import frozen Project predictions into the
control harness; this enables coverage/routing/rendering checks without building
provider adapters or paying for calls. A local scoring adapter is a separate
conditional experiment, consistent with #68's runtime decision.

Proposed private artifacts (new contracts to review, not existing commands):

| Artifact                              | Contents and invariant                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `source-inventory.v1`                 | Body-confirmed editions, message identity, source block IDs, expected editorial/exclusion counts; no raw Gmail body      |
| `classifier-candidate-manifest.v1`    | Every candidate and terminal boundary outcome, run lineage and verified/observed metadata                                |
| `classifier-evidence-adjudication.v1` | Append-only corrections and dispositions, source fingerprints, historical-policy status, no rewritten originals          |
| `classifier-evaluation-split.v1`      | Dataset fingerprints, immutable split assignments, article/story groups, contamination/exposure ledger and sampling seed |
| `classifier-evaluation-run.v1`        | Frozen inputs/predictions, actual model config or unknowns, prompt/profile hashes, repeat IDs, metrics and timing        |
| `tldr-day-manifest.v1`                | All editions/source instances, canonical groups, survivor/suppressed mapping, queue hashes and generation revision       |

Use the existing feedback-label.v1 store for compatible exact labels. Preserve
incompatible-history candidates in the adjudication contract rather than widening
v1's route enum without known semantics. A report may compare their independently
verified desired axes while marking the historical original route unverified.

For new runs, compute metadata outside model output wherever execution is owned
by code. Project-side declared versions must be checked against pinned uploaded
content; unsupported model/effort details remain unknown, not invented. Freeze a
fresh observed Project baseline separately from the repository-contract control.

Queue v3 has strict fields. Keep deduplication provenance in a sidecar first;
if replay/reference access needs consumer changes, design that migration before
promoting the feature. Never smuggle extra fields into v3. A future altered
headline-only template or physical playback/reference split needs an explicitly
new contract with v2/v3 compatibility in readers and embedded bundle snapshots.

## Reviewable PR sequence

These are proposed PR identifiers, not already-open GitHub PR numbers. Default
branches below use `agent/classifier-v2-*`; select final names at implementation.
Target one behavioral concern per PR, usually a few production files plus focused
fixtures. Split a row further if schema, runtime and integration changes become
hard to inspect together. There is no requirement to force a dependent patch to
compile or deploy against the wrong base merely to keep it small.

| PR                                                     | Base / dependency                                 | Reviewable scope and files                                                                                                                                                                                               | Acceptance and rollback                                                                                                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 — this plan                                         | `main`                                            | `docs/classifier-v2/`; requirements, issue dispositions, protocol and stack                                                                                                                                              | Review the proposed choices; no live rollback needed                                                                                                                                                    |
| P1 — diagnostics contract and collection               | `main` after P0                                   | Source inventory + candidate manifest schema/validator; hooks in `src/tldr/`; synthetic omissions/exclusions fixtures; manual Project diagnostic instructions kept opt-in                                                | R1/R2: one complete real private manifest and July 28 boundary accounting; source count equality. Disable sidecar collection, scoring unchanged                                                         |
| P2 — evidence/version reconciliation                   | P1 branch until merged                            | Adjudication schema and importer/report beside `src/classifier/feedback-label.ts`; reconcile all dated exact candidates, retractions and metadata mismatch cases                                                         | R2/R4: originals immutable; duplicate imports idempotent; unknown policies never aliased; no live label consumption. Stop importer, retain immutable data                                               |
| P3 — blind labeling and baseline report                | P2 branch                                         | Split manifest, private local labeling interface and evaluator; import known legacy labels without inventing missing depth; isolated frozen Project prediction import                                                    | R5: complete July 28 gold, locked replacement split, five-boundary baseline report and tests for leaked predictions/group overlap. Stop experiment; baseline stays live                                 |
| P4 — deterministic queue-v3 control                    | P1 branch, or `main` after P1                     | `src/commute/` renderer reusing existing validation/routing, no scorer calls; known-input golden output and honest version binding                                                                                       | R3/R9: reproduce exact v3 strings, score threshold boundaries, ordering, null attribution, missing-output failures and bundle round trip. Keep outputs offline                                          |
| P5 — optional local scorer experiment                  | P3 + P4 merged; explicit runtime-control decision | One provider-neutral adapter interface, one configured provider, bounded batching/timeouts/retries, private prediction persistence; propose commands only here                                                           | R3/R5/R8: same frozen inputs, observed provider/model metadata, invalid batches quarantined, cost/time and Project disagreement report. Revert to imported predictions; no production ownership assumed |
| P6 — four-week candidate experiment                    | P3; P5 optional                                   | Versioned experiment configuration, 2–4 candidate profiles/prompts per selected cluster outside canonical schema files; weekly sanitized reports                                                                         | R5: four blind weekly reports and final holdout decision. No live mutation; stop/no-change is acceptable                                                                                                |
| P7 — measured scoring promotion                        | P6                                                | New OpenSpec change for only the winning profile/prompt/threshold/consumption policy; explicit replacement of stale holdout rules where not already handled in P3; synthetic regression cases and coupled-version record | R3/R4/R5/R8: predeclared gates and Brad approval, manual control, one-edition canary then remaining editions. Restore prior coupled sources and exact recorded versions                                 |
| P8a — exact daily duplicate reducer                    | P4 merged                                         | Canonicalizer/day-manifest + pure reducer; source-text selection, provenance, empty queues and late-edition fixtures; no live deployment                                                                                 | R6: zero duplicate exact URLs and zero unrelated suppression on gold groups; repeat-run identity stable. Disable reducer                                                                                |
| P8b — Project-native daily producer pilot              | P8a                                               | Explicit OpenSpec generation/provenance behavior; retrieve all editions first, classify canonical groups once, emit per-edition queues together; exact live-file deployment instructions                                 | R6/R8: identical-input manual control and phone access/replay, then scheduled trial. Keep baseline per-edition producer for rollback; this feature can advance independently of P6's scoring decision   |
| P9 — short-playback usefulness trial                   | P4 merged; independent of scoring                 | New queue template/schema version only if needed, renderer/validator/bundle reader, bounded source-exact short-description trial and matching Project sources                                                            | R7/R9: no inferred depth changes, blind usefulness/pacing comparison and actual iPhone trial. Restore v3 producer and sources, keep old readers                                                         |
| P10 — minimal playback artifact trial                  | After P9 decision, separate #100/#120 work        | Evaluate v3-equivalent full versus minimal artifact/reference split, exact hash/ID join, lazy reference and bundle export; no scoring changes                                                                            | R9: observed long-session evidence, reference access and export; absence of an executable phone harness stays explicit. Restore single-file v3                                                          |
| P11 — related-story annotations / delivery replacement | Only after specific feasibility decisions         | Two separate follow-ups: related-story annotation after exact groups; or unattended Gmail/cloud plus demonstrated mobile delivery                                                                                        | R6/R8: no automatic fuzzy suppression without precision evidence; no production runtime switch until intake-through-phone works. Neither is required for first v2 adoption                              |

P1 collection can include parser instrumentation and an opt-in Project sidecar
request, but cannot pretend that a local hook instruments a remote Task. Verify
which boundary actually emitted each manifest. P3's split protocol must formally
update the relevant OpenSpec holdout clauses before corpus tuning starts; P7 then
adds only production-behavior deltas. Keep #66 open until its real corpus and
baseline deliverables are complete.

Logical stack:

```text
P0 -> P1 -> P2 -> P3 -> P6 -> P7
       |           |     ^
       +-> P4 -----+-> P5 (optional)
            +-> P8a -> P8b
            +-> P9 decision -> P10
P11 follows the relevant measured decision, not the calendar.
```

Operationally, keep at most two or three unmerged dependent PRs. A child PR targets
its immediate parent branch so Brad sees only the new slice. Once a parent merges,
rebase the child onto updated `main` and retarget it; verify the diff contains no
parent commits. Shared dependencies on two stacks should merge before opening the
integration PR. Each description names requirements, parent PR, one before/after
example, deterministic checks, private experiment evidence and live deployment
steps. Review code/schema/prompt behavior once at the latest complete head;
merge only after Brad approves. A planning PR is not approval for rollout.

## Historical replay and gold collection protocol

### Acquire without leaking the future test

The read-only search found 85 recent Trash candidates and 10 July 27–29 candidates,
not a verified corpus. Enumerate all result pages and verify direct sender, body
markers, delivery timestamp and edition type. For the July 28 coverage exercise,
retrieve the exact day across all four newsletter types and record editions that
are absent. Do not reconstruct unavailable newsletters from survivor queues.

For replay, stream confirmed bodies through extraction without persisting raw
email bodies. Save immutable sanitized editorial records and exclusion/review
metadata under `.private/classifier-v2/`. Do not restore, relabel or delete mail
as a side effect. A Gmail API path must include Trash explicitly; a connector
must demonstrate that its Trash query actually returns the targeted messages.
Gmail deletes messages after 30 days in Trash, so this is the first acquisition
priority. [Google deletion policy](https://support.google.com/mail/answer/7401),
[API listing option](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list).

Inventory historical private queues, bundle intakes, attempted labels and exact
shared-chat evidence by identity before importing. Use existing sanitized copies
where available; never rewrite normalized historical originals. July 28 is a
known diagnostic development set. August and September heard/discussed material
is replay/regression data unless a contamination audit proves otherwise.

### Freeze datasets and collect independent answers

1. Inventory original 262 training, 41 June 30 and 98 July 1–2 records. They are
   known development/calibration history now. Preserve legacy labels as legacy;
   an old single-axis `down` cannot supply an unobserved depth label.
2. Build July 28 complete-coverage gold by asking Brad for both axes for every
   editorial item. A source-confirmed omitted item is not gold until labeled.
   Present source title/summary/link with predictions and rationales hidden.
3. Form development and weekly review pools from known history and new labeled
   exposure. Include every exact correction, every candidate from unusually
   sparse days, a seeded random skip sample, near-threshold samples (interest
   0.55–0.65 and 0.75–0.85; depth 0.55–0.65), and confident-correct controls.
4. Choose final holdout by entire unseen delivery dates, with all canonical
   article and related-story duplicates assigned to the same split. Preserve
   distinct newsletter instances inside their split. Exclude groups already
   present in training, prompts, wiki discussions, issue examples or reviewed
   development outputs. If the historical pool is contaminated, collect later
   fresh dates; lack of clean material delays promotion, not the commute.
5. Proposed planning target: at least 100 final-holdout editorial instances from
   at least three delivery dates covering all four newsletters when available.
   Aim for at least 20 gold-interested and 20 gold-in-depth items before claiming
   directional confidence; rare lanes are reported as insufficient evidence.
   These are proposed practical floors, not a statistical power guarantee.
   Freeze target date blocks before seeing labels; inadequate strata yield an
   inconclusive result and a newly declared additional test, not cherry-picking.
6. Freeze baseline and candidate versions and predictions to immutable files
   **before** Brad labels each blind batch. The label UI must not serve hidden
   prediction values to its client. Collect independent interest and depth,
   optional reason and an explicit unsure/missing response. Do not force numeric
   scores from Brad. Save progress/resume without exposing earlier predictions.
7. Candidate generation/scoring gets only allowed profile, prompts and sanitized
   inputs; no issue feedback, label store or answer-containing chat context.
   Execute via fresh isolated scoring contexts rather than using the research
   conversation. The scorer may see held-out text only to predict; the tuner
   must not inspect final test text, labels or error reports before final scoring.
8. Freeze label hashes, then compare. A final holdout whose errors are inspected
   becomes development data for the next revision. Do not tune and report a
   second run on it as fresh validation.

Separate axis records for Matic/Waymo are joined into one desired two-axis target
per article with both source references; they are not two independent article
samples. For a depth-only correction, do not treat the unchanged original interest
as independently confirmed gold. Report missing dimensions and their denominators.

### Baselines, ablations and four weekly cycles

Compare (A) observed Project baseline, (B) repository-contract replay with the same
frozen predictions, and optionally (C) one pinned local scoring configuration.
A versus B isolates validation/routing/rendering differences; A versus C is a
producer/model comparison, not proof that a profile alone improved. Save all
configurations and actual observed metadata. Unknown Project runtime details
limit reproducibility and must be stated in the report.

Choose the highest-harm development clusters first. For each compare 2–4
alternatives: narrow named-example rule, transferable causal preference, overly
broad rule, and unchanged/threshold-only control where useful. Freeze interest
rules while evaluating depth heuristics and vice versa where feasible. Do not
change provider, thresholds, deduplication and playback policy in the same scoring
comparison. “Weakest valid revision” means broad safe empirical coverage, with
fewer exception predicates and robustness after names are removed; it is not
shortest prompt, nor a theorem establishing newsletter performance.

Once P3's corpus is ready, run four weekly blind cycles. If ready September 7,
provisional weeks are September 7–13, 14–20, 21–27, and September 28–October 4;
otherwise shift the entire window. Proposed weekly review size is 20–30 items
plus exact corrections and sparse-day coverage, with Brad's measured labeling
burden reported. Weekly feedback may refine development candidates under the
protocol, never live production. Freeze the finalists before opening final test
predictions/labels. Do not repeatedly tune against the locked final holdout.

Repeat model scoring three times on a fixed development stress set to expose
instability; retain every replicate rather than selecting the best run. For the
final comparison, use the predeclared repeat/aggregation policy (recommended:
three independent runs, report mean and range plus each run's failures). Saved
prediction replay is deterministic; fresh model sampling is not.

### Metrics and proposed promotion gates

These proposed limits need agreement in P3 **before** predictions are evaluated.
They are not previously approved user preferences. Keep the hard integrity rules
regardless of tuning; if thresholds prove too strict, amend a future protocol
before testing on new holdout data, not after seeing the desired result.

| Measure            | Definition and proposed gate                                                                                                                                                                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source coverage    | Independently enumerated editorial blocks versus parsed candidates. Zero unexplained omissions in reviewed fixtures and complete holdout editions                                                                                                                                                                                  |
| Contract integrity | Zero invalid artifacts accepted, unknown provenance asserted as known, missing IDs silently discarded, or leaked private/holdout data. Failure stops promotion                                                                                                                                                                     |
| False skips        | Gold interested/maybe but predicted uninterested; report count/rate over gold-surfaced items, by interest level and confidence distance. No increase versus baseline and no new high-confidence gold-interested skip (proposed score <0.50)                                                                                        |
| Depth misses       | Gold in-depth predicted headline-only, evaluated only where depth gold exists; report conditional surfaced and end-to-end missed-in-depth counts separately. No increase versus baseline                                                                                                                                           |
| False discusses    | Predicted in-depth and surfaced, gold uninterested or gold headline-only. Report separately from optional-label disagreement; no more than one additional case per 100 labeled instances                                                                                                                                           |
| Weighted harm      | Predeclare a transparent diagnostic loss: 5 per gold-interested skip, 3 per gold-maybe skip, 2 per false discuss, 1 per missed depth on a surfaced item. Count each item at its highest applicable cost. Strictly lower mean holdout harm for a scoring promotion; no-change remains valid                                         |
| Calibration        | Per-axis confusion matrices, scores and threshold-distance bins; depth denominator excludes unknown/n/a gold. Scores are ranking judgments, not assumed probabilities; reliability plots are descriptive                                                                                                                           |
| Pacing             | Compute literal speech duration at a frozen 150 words/minute; report sweep/default text separately from optional discussion scenarios (e.g. 2 and 5 min per in-depth item). Proposed added default playback cap: 10% or two minutes per day, whichever is larger; actual discussion time remains measured, not claimed from labels |
| Deduplication      | Zero unrelated items suppressed and complete source retention on hand-labeled exact groups. Report per-instance and per-canonical-group classification metrics so repeated stories do not inflate confidence                                                                                                                       |
| Generalization     | Newsletter, date and preference-lane slices, named-entity removal probes, exception count and changed-item list. Report small strata as uncertain; use paired date/story-group resampling where sample size permits                                                                                                                |
| Runtime/cost       | Per-edition and per-item latency, retries, failure rate, measured token/API cost when available, and human review time. Establish a budget from baseline before the trial; no invented price or inference-time estimate                                                                                                            |
| Delivery           | Manual same-Project control produces real valid phone-accessible queues; scheduled replacement needs three consecutive qualifying weekdays or retains explicit manual fallback                                                                                                                                                     |
| Voice              | Actual iPhone long-session test reports literal-match failures and exports independently. A scoring release may improve labels without claiming #100 closed; a playback-reliability claim requires zero observed foreign/omitted default text in its acceptance trial                                                              |

Report counts and paired changes alongside percentages; do not hide hard failures
in averages or claim statistical certainty from a small holdout. A candidate
must meet integrity, harm and pacing constraints before preference for broader
extension or lower cost matters. Freeze the numeric gate configuration and hashes
in the protocol PR. A severe reproducible false-skip regression stops that
candidate immediately; no automatic global threshold patch follows.

## Adoption and verification

For each deterministic implementation PR run focused fixtures, then `npm run
check`, `git diff --check`, and strict OpenSpec validation for touched changes.
P1/P3 and production changes touching the J1–J6 boundary validate both baseline
changes plus the new relevant change. CI uses synthetic fixtures, not Gmail or
paid model calls. Private replay outputs stay private; commit only sanitized
aggregate reports and source-backed regression examples permitted by the split.

After a scoring promotion is approved: validate a manual same-Project replay,
canary one real edition, then all editions, then assess scheduled operation.
Record exact live files installed and verified content/version hashes; a merged
repository diff does not deploy Project sources. Keep a release-scoped rollback
record for materially coupled profile, prompt, thresholds, routing, queue schema,
producer and model configuration. Do not overwrite or relabel old generated
queues. Roll back on integrity, material coverage or delivery regression, retaining
the failed run for diagnosis.

Headline context, deduplication and minimal-artifact trials keep scoring pinned.
For the minimal artifact trial, start with full versus minimal **equivalent text**
and compare late-session behavior; test missing/mismatched reference, direct
source questions and full-snapshot export before any live default. Do not build
an autonomous iPhone harness until actual audio control/observation is demonstrated.
Manual acceptance is an explicit part of this plan, as requested.

## Decisions for review

The recommended defaults are: Project/manual production for Monday; immutable
historical replay first; no online feedback mutation; current two axes retained;
new clean holdout and four weekly cycles before scoring promotion; exact daily
URL deduplication before fuzzy story suppression; separate short-context and
minimal-artifact trials. The proposed sample sizes, harm weights and pacing cap
need agreement in the protocol PR. Runtime ownership remains conditional on
measured value and end-to-end phone delivery. No paid provider choice or hosting
commitment is required to approve the initial diagnostics work.
