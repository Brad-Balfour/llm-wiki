# Article classifier v2 requirements

Status: proposed for Brad's review; no production behavior changes. Evidence
snapshot: September 5, 2026, through September 4 commute feedback. See the
[complete 16-issue, 74-comment inventory](evidence-inventory.md) and
[implementation and evaluation plan](implementation-plan.md).

The proposed v2 is an evolution of the **newsletter-to-queue pipeline**:
complete extraction, trustworthy classification, application-owned routing,
duplicate handling, and useful JSON files for the existing commute. Its first
release should make every omission explainable and every experiment reproducible.
Improved scoring follows a blind evaluation; it is not a prerequisite for using
Monday's newsletters.

## Current baseline and precedence

- Profile `1.4`, `classifier-instructions.v1`, and `routing-rules.v1` are the
  committed scoring/routing baseline. Interest thresholds are 0.60 and 0.80;
  depth is 0.60, inclusive. The repository validates model output and derives
  routes; it does not yet provide a complete local model-to-queue producer.
- New live artifacts already use `tldr-commute-queue.v3`, including literal
  `description`, `playback_text`, and `sweep_playback`. Voice Prompt **4.2** and
  `session-export.md` were verified live September 4. Local readers still accept
  unchanged queue-v2 artifacts. [Current Project record](../../chatgpt-project/README.md)
- “Classifier v2” is a release name, **not** queue-v2, the historical
  `tldr-classifier-v2` string invented in some queues, or another Voice prompt
  revision. New releases must declare their actual constituent versions.
- The [operating-loop compatibility map](../../openspec/changes/commute-wiki-operating-loop/design.md)
  governs conflicts with bootstrap guidance. [#66](https://github.com/Brad-Balfour/llm-wiki/issues/66)
  and [#68](https://github.com/Brad-Balfour/llm-wiki/issues/68) defer feedback
  consumption and local production ownership until measured decisions. Their
  evidence-first sequence remains the recommended plan.
- The blanket historical “July 3+ is clean holdout” rule is no longer evidence
  of cleanliness after two months of use. A new OpenSpec change must explicitly
  replace it with contamination tracking and a locked split before tuning.
- #36's August 24 decision supersedes its original source-ID-first cross-queue
  proposal: use final canonical URLs across editions, preserve source IDs as
  provenance, and keep Project-native phone access. Its proposed queue-v3 work
  predates the already-delivered v3 schema; do not reuse that version number for
  incompatible deduplication or playback changes.

## What the v1 experiments actually established

The local historical archive records 262 fully labeled training items, a
41-item June 30 holdout, and a fresh 98-item July 1–2 two-axis holdout. The first
41-item comparison matched 19/41 legacy labels and overused the middle category.
The fresh two-axis evaluation matched interest on 53/98 (54.1%), depth on 49/55
of gold-surfaced items (89.1%), and derived Voice behavior on 64/98 (65.3%). Its
interest matrix includes 18 false skips: 15 gold-interested and 3 gold-maybe.

After revising the profile using those same 98 labels, a rescore reached 75/98
interest (76.5%), 50/55 depth (90.9%), and 82/98 derived Voice behavior (83.7%),
with three false skips. **That was calibration, not fresh validation.** Historical
legacy route/Voice metrics are not interchangeable with current optional routes
or actual spoken compliance. This also was not a controlled evaluation of every
component of the current production profile, which combines Claude and Codex
research; see [source synthesis](../source-synthesis.md).

Retain the label-first, predictions-hidden method, independent axes, and
item-level comparisons. Improve it with split fingerprints, contamination
checks, full-candidate coverage, and separate scoring, routing, presentation,
and real Voice outcomes. No new v2 scores have been measured in this planning task.

## Evidence reconciliation

Opening bodies of #35 and #66 list three initially stored corrections. Later
comments add many more. The following is an acquisition checklist, not a claim
that all rows already satisfy the current private recorder. Repeated comments
across issues and re-exported bundles count once.

| Session evidence    | Exact correction or candidate to reconcile                                                            | Boundary                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| July 20, 21, 24     | Codex model choice depth up; Kimi Work interest down; The Robots Cometh depth up                      | Three initially verified stored records in #35/#66                                                  |
| July 24             | Fugu-Ultra interest down                                                                              | Later umbrella explicitly downgrades earlier JSON backfill to unverified; never silently promote it |
| August 6            | iCloud Private Relay; Unit Economics of Software, depth up                                            | Original version/score-label consistency needs audit                                                |
| August 7, 12, 13–14 | HTMX forms; Roadmap decisions; HTML over WebSockets, depth up                                         | Exact intent retained; recorder blocked on historical route metadata                                |
| August 15           | Sol Ultrafast; Agent Plugins; DeepSeek Harness, depth up                                              | Some labels require chat plus canonical queue, not bundle alone                                     |
| August 18–19        | Zero-knowledge proofs; disposable CI; Software Craftsmanship; Saggar; TermDOM, depth up               | Historical metadata blocked recording                                                               |
| August 21           | Slack Code; Waymo robocar chip; Fig, depth up; Better Batteries and Bun 1.4, interest down            | Five exact candidates, not five automatically accepted store entries                                |
| August 28           | Sass migration; AcceptMarkdown; Claude Cowork; Anthropic lab hardware, depth up; DuckDB interest down | Five exact candidates; preserve original versions                                                   |
| September 1         | Matic robotics, interest and depth up                                                                 | Two dimension-specific records passed recorder; one article                                         |
| September 2         | Waymo, interest and depth up                                                                          | Two independent-axis labels for one article                                                         |
| September 3         | London robotaxis, depth up                                                                            | Preserve `maybe` interest; no inferred interest correction                                          |

Sources: [#35 discussion](https://github.com/Brad-Balfour/llm-wiki/issues/35),
[#66 discussion](https://github.com/Brad-Balfour/llm-wiki/issues/66), and the
[dated experiment log](../commute-experiment-log.md).

Several historical queues say `headline_only` at depth scores 0.60, 0.61, or
0.66; one says `interested` at 0.79. Under committed thresholds these are
contract inconsistencies before they are calibration misses. An intent correction
can remain valid evidence while its original scoring policy is unresolved.
Do not “fix” history by renaming `commute-route-v2` to `routing-rules.v1`.

Candidate preference families to compare, not immediate production rules:

| Family                                                         | Supporting evidence                                                                          | Required counterexamples                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Robotics, physical AI, autonomous driving                      | Robots Cometh, Matic, repeated Waymo corrections and automotive preference                   | Routine hardware/finance coverage; do not infer all robotics items require depth                  |
| Practical agent engineering and usable techniques              | Codex selection, AI review, Agent Plugins, Slack Code, concrete implementation requests      | Generic launches, inaccessible tools, marketing without reusable methods                          |
| Software craft, frontend architecture, CI and product judgment | HTMX, WebSockets, CI, roadmap and craftsmanship corrections; Martin Fowler author preference | Narrow irrelevant frameworks and uninformative routine releases                                   |
| Practical accessibility versus conceptual relevance            | Fugu discussion, actionability complaints                                                    | Useful conceptual lessons despite unavailable products; no mandatory third scoring axis yet       |
| Selective negative lanes                                       | Kimi, Bun, DuckDB, Better Batteries; routine Grok/open-weight coverage                       | Independent workflow, governance, product or science lessons that should overcome topic shorthand |
| Broader science, computing culture, tool awareness             | Original blind evaluation and profile 1.4                                                    | Generic platform/business news; author/company-name memorization                                  |

Opaque titles such as Mole, fx, GlassBox, Vocab Break, Muse Image, Experiential,
Cohere Parse, and Wigolo are **presentation QA** unless Brad explicitly corrected
an axis. Fig can have both a QA observation and an independent depth correction.
The actual words override an assistant-generated `promote_to_in_depth` event.
“Skip,” “already heard,” “already wikied,” a wiki save, favorable discussion,
and silence are not automatic interest/depth labels.

## Required behavior and acceptance criteria

Priorities: P0 establishes evidence and protects the working commute; P1 delivers
measured improvements; P2 is a separately gated experiment. Each ID maps to a
proposed PR in the implementation plan.

### R1 — Complete intake and explicit loss attribution (P0; #35, #66, #37)

Discover direct TLDR General, Dev, AI and Fintech deliveries for the requested
America/New_York date/range. Confirm sender and body markers; subject alone is
insufficient. Keep the existing text-input fallback. Extract every editorial
item, excluding sponsors, quick-link ads, hiring/referrals and wrapper material.
Use source delivery date for filenames, including catch-up runs.

Acceptance: a hand-reviewed full-newsletter fixture accounts for every block as
editorial, excluded with reason, or ambiguous for review. A private diagnostic
manifest records the first failed boundary: discovery, parsing, URL resolution,
classification, validation, routing, deduplication, or rendering. Compare parsed
candidates against the independently enumerated source inventory; a parser's own
output cannot prove parser recall. No survivor-only coverage claim is accepted.

### R2 — Immutable, honest run diagnostics (P0; #66)

The proposed private `classifier-candidate-manifest.v1` contains run identity,
source message/edition identity, sanitized candidate title/summary/URL, parser
version and exclusion reason, opaque classifier request ID, complete output,
validation errors, actual profile/prompt/provider/model/threshold/route versions,
content hashes, derived route, queue inclusion/exclusion reason, and surfaced
filename/position. Keep observed original metadata alongside any later verified
interpretation; unknown means unknown. Record configuration and actual execution
separately. Avoid self-reported fabricated model identifiers.

Acceptance: inventory totals reconcile from source blocks to terminal outcomes;
missing output is a recorded failure, never `uninterested`. Immutable attempts
retain retry lineage and fingerprints. New production metadata binds to actual
versioned content, not merely nonempty strings. Diagnostics and sanitized replay
sources remain under `.private/`; no raw Gmail bodies or private work content are
persisted in new artifacts or committed.

### R3 — Independent, validated classification and owned routing (P0; #35, #68)

Preserve the exact source-neutral classification record and request-ID
reconciliation in [classifier instructions](../../schema/classifier-instructions.md).
Validate finite scores, labels, one result per input, forbidden fields and
score/label consistency before routing. Retain current thresholds until a
reviewed experiment changes them. Keep provider/model selection outside parser
and routing. `maybe` expresses optional interest, not model uncertainty.

Acceptance: malformed, missing, duplicate, unknown-ID, or inconsistent outputs
fail closed with diagnostic reasons. Bounded retries never silently drop items.
Application routing includes both interested and maybe candidates under the
current queue contract; no unreviewed top-N budget explains away sparse output.
Depth remains independently predicted even for uninterested items. Wiki behavior
is a candidate signal; only an exact wiki request authorizes maintenance.

### R4 — Trusted evidence with explicit historical adjudication (P0; #35, #66)

Retain exact user words, queue fingerprint, filename, item identity, URL, original
scores/labels and producer metadata, corrected dimension, date and source of
verification. Keep separate channels for verified corrections, exact candidates
with unresolved policy, unverified backfill, topic preferences, headline QA,
duplicates/prior awareness, playback/platform incidents, wiki captures and
assistant synthesis. Preserve retractions and contradictory evidence.

Acceptance: import all discoverable later evidence in the table above once,
with an explicit disposition per record. Revalidate against canonical artifacts;
comments alone do not establish a private-store count. Append adjudication as a
new record without overwriting originals. Historical unknown routing does not
block recording a user's independent-axis intent, but it blocks claims about a
verified original route policy. No label affects live behavior until the tested
consumption decision in #68. Do not invent a corrected numeric score.

### R5 — Gold dataset, holdout and measured promotion (P0/P1; #66, #68)

Create a reviewed July 28 coverage set, a deduplicated correction corpus, a
separate development set, and a new locked final holdout. Gold labels come from
Brad before predictions are revealed. Keep known/exposed history out of the
final holdout. Preserve cross-edition instances for evaluation, while assigning
all instances of a canonical article or related story to the same split.

Acceptance: freeze source, label, split and prediction hashes; evaluate baseline
and candidates on identical inputs. Publish interest/depth confusion matrices,
false skips, false discusses, threshold distance, score distributions, pacing,
queue size and per-newsletter/preference-lane outcomes. Run four weekly blind
review cycles and one final locked evaluation. The protocol defines denominators,
missing labels, candidate isolation, costs, stopping rules and human approval.
A justified no-change result is valid; in-sample gains alone cannot promote v2.

### R6 — Day-level exact duplicates with full provenance (P1; #36)

Collect all qualifying editions before rendering any queue. Resolve TLDR
redirects, normalize known tracking parameters conservatively, and group by final
canonical article URL across newsletters. Classify each canonical group once,
retaining every source instance and its original title/summary and source order.
Do not deduplicate distinct paths or semantic query parameters by hostname.

Acceptance: deterministic source-input selection and survivor policy, complete
provenance, no second playback occurrence of an exact URL, regenerated positions,
totals and sweep text, and idempotent reruns. Track generated/suppressed versus
actually heard separately. A request to replay resolves the retained survivor;
queue selection must work even if the first queue Brad opens had all duplicates
removed. Empty queues and late-arriving editions need explicit manifests and
revision rules, never silent replacement of files used by an active session.
Use a sidecar day manifest where possible; do not add fields to strict queue v3.

The issue's highest-interest, then highest-depth, then earliest-occurrence rule
applies to historical independently scored duplicates. A classify-once group
has common scores, so fresh groups naturally use earliest stable occurrence;
original source text remains available for a later “new context” request.

### R7 — Informative short playback without false depth labels (P1; #35/#66 QA)

Test whether a short, literal newsletter description gives useful context for
opaque names while preserving `headline_only`. This is a rendering policy
experiment, not a reason to promote every unfamiliar product to `in_depth`.

Acceptance: compare existing headline-only playback with a source-exact short
excerpt, measuring usefulness and added seconds separately from classification.
Do not generate explanatory facts from a product name. Preserve full description
and exact attribution or `null`. Any changed `playback_text` template requires a
new queue version and coupled renderer/schema/consumer/Project changes; current
v3's literal template must continue to validate unchanged historical artifacts.

### R8 — Actual delivery and rollback remain usable from the phone (P0/P1; #37, #36)

Keep the live same-Project Gmail producer and its manual identical-prompt control
until a replacement proves unattended intake **and** usable phone/Project
delivery. A local scorer is initially an offline diagnostic control. Local
processing plus recurring download/re-upload from a home computer is not an
acceptable permanent architecture.

Acceptance: real parseable dated JSON `.txt` downloads for every qualifying
edition, explicit failures/missing editions, safe idempotent retries, and no
success based only on scheduler status. Retain the manual fallback until three
consecutive qualifying scheduled weekdays succeed. A cloud/API replacement is
conditional on proving delivery; do not assume an automatic Project Library
write bridge exists. Production source updates list exact files and verified
live versions and support rollback without rewriting past queues.

### R9 — Consumer compatibility and observable Voice acceptance (P0/P2; #100)

Preserve one queue per session, deterministic sweep/playback strings, navigation,
self-contained bundle snapshots, exact item saves/feedback and local recovery.
Valid reconstructed artifacts do not prove what Voice actually said. Test actual
iPhone Voice independently of offline JSON checks.

Acceptance: a representative long session covers sweep, next/back/jump, pause,
discussion, restart/re-anchor, literal text, exact URL questions and visible
export. Foreign content, missing literal content and failed first exports are
counted. Prompt 4.2 and v3 have already failed this outcome on September 4; do not
claim a new scorer solves it. The separate minimal-playback/reference-artifact
proposal in [#120's latest comment](https://github.com/Brad-Balfour/llm-wiki/issues/120#issuecomment-5548380533)
needs its own bounded trial, identity/hash binding, bundle compatibility and
rollback. A desktop text proxy is not proof of controllable iPhone audio.

### R10 — Small reviewable changes and measured operational cost (P0; user request)

Use focused PRs with explicit base/dependencies, acceptance evidence, sample
before/after output and rollback. Preserve valid command behavior and fail early
on invalid CLI arguments/private paths (#94). Keep parser, scorer, routing,
renderer, delivery and Voice changes independently measurable.

Acceptance: deterministic CI runs offline with synthetic sanitized fixtures;
paid/private replay is an explicit separate run. Record per-stage wall time,
retries, model usage/cost when available, and human labeling time. Do not equate
orchestration residual with inference time. #85 abandoned Terra for commute
maintenance; that evidence neither selects nor disqualifies an article-scoring
model. No production merge or deployment occurs without Brad's approval.

## Scope boundaries

[#26](https://github.com/Brad-Balfour/llm-wiki/issues/26) explains why provenance
and grounded source retrieval must survive queue changes; it does not justify
auto-saving articles. #48, #95 and #96 remain maintainer/reconciliation tasks,
with compatibility tests where needed. #8, #52 and #112 are independent Pages,
search and workspace work. #85/#119 supply operational lessons without making
all commute profiling a prerequisite. Related-story automatic suppression,
unattended cloud migration, a custom Voice client, third-axis scoring, model
fine-tuning, and daily multi-provider ensembles are not default v2 scope.
