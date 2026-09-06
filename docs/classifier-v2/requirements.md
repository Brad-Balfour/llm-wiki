# Article classifier v2 requirements

Status: proposed for Brad's review; no live behavior changes. Evidence
snapshot: September 5, 2026, through September 4 commute feedback. See the
[complete 16-issue, 74-comment inventory](evidence-inventory.md) and
[implementation and evaluation plan](implementation-plan.md).

V2 improves the process that turns newsletters into commute queues: extract every article, classify it, apply routing rules in code, remove duplicates, and produce useful JSON files. Its first
release should make every omission explainable and every experiment reproducible.
Test scoring changes against Brad’s answers before using them for daily queues. Monday’s commute can continue with the current version.

## Current version and which requirements apply

- Profile `1.4`, `classifier-instructions.v1`, and `routing-rules.v1` are the
  scoring and routing rules currently in the repository. Interest thresholds are 0.60 and 0.80;
  depth is 0.60, inclusive. The repository validates model output and derives
  routes; it does not yet provide a complete local model-to-queue producer.
- New queue files already use `tldr-commute-queue.v3`, including literal
  `description`, `playback_text`, and `sweep_playback`. Voice Prompt **4.2** and
  `session-export.md` were verified live September 4. Local readers still accept
  unchanged queue-v2 files. [Current Project record](../../chatgpt-project/README.md)
- “Classifier v2” is a release name, **not** queue-v2, the historical
  `tldr-classifier-v2` string invented in some queues, or another Voice prompt
  revision. New releases must declare their actual versions of the profile, prompts, routing rules and file format.
- The [operating-loop compatibility map](../../openspec/changes/commute-wiki-operating-loop/design.md)
  takes priority when it differs from the older bootstrap requirements. [#66](https://github.com/Brad-Balfour/llm-wiki/issues/66)
  and [#68](https://github.com/Brad-Balfour/llm-wiki/issues/68) defer using feedback in scoring and replacing the Project with a local program until the results justify those changes. The plan follows that sequence.
- The old instruction to reserve July 3 onward for testing no longer proves those articles are unused: many have since been discussed or used to improve the system. A new OpenSpec change must explicitly
  replace it with a record of which articles have already been used and a fixed, separate test set before tuning.
- #36's August 24 decision supersedes its original source-ID-first cross-queue
  proposal: use final article URLs with tracking removed across editions, preserve every newsletter’s source ID, and keep access through the existing Project on the phone. Its proposed queue-v3 work
  predates the already-delivered v3 schema; do not reuse that version number for
  incompatible duplicate removal or playback changes.

## What the v1 experiments showed

A **gold dataset** contains Brad’s reference answers. A **holdout** is a separate set of articles reserved for testing, whose answers have not been used to revise the classifier. In a **blind review**, Brad labels articles without seeing the model’s predictions.

The local historical archive records 262 fully labeled training items, a
41-item June 30 holdout, and a fresh 98-item July 1–2 two-axis holdout. The first
41-item comparison matched 19/41 legacy labels and overused the middle category.
The fresh two-axis evaluation matched interest on 53/98 (54.1%), depth on 49/55
of items Brad wanted included (89.1%), and derived Voice behavior on 64/98 (65.3%). Its
interest matrix includes 18 false skips: 15 items Brad labeled interested and 3 items Brad labeled maybe.

After revising the profile using those same 98 labels, a rescore reached 75/98
interest (76.5%), 50/55 depth (90.9%), and 82/98 derived Voice behavior (83.7%),
with three false skips. **Those results measured improvement on answers already used to revise the profile, not performance on a new test set.** The old route and Voice-behavior results used different rules from today’s optional routes. They also did not measure what Voice actually said. This also was not a controlled evaluation of every
part of the current profile, which combines Claude and Codex
research; see [source synthesis](../source-synthesis.md).

Keep collecting Brad’s labels without showing predictions, score interest and depth separately, and compare results article by article. Record file hashes so changes to the datasets can be detected. Check for articles already used in training, account for every newsletter item, and measure scoring, routing, presentation and actual Voice playback separately. This planning task has not measured v2 scoring results.

## Checking the recorded feedback

Original descriptions of #35 and #66 list three initially stored corrections. Later
comments add many more. The following is a list of feedback to collect and check, not a claim
that all rows already satisfy the existing tool that saves feedback privately. Repeated comments
across issues and re-exported bundles count once.

| Session evidence    | Exact correction or feedback to verify                                                                | What still needs checking                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| July 20, 21, 24     | Codex model choice depth up; Kimi Work interest down; The Robots Cometh depth up                      | Three initially verified stored records in #35/#66                                            |
| July 24             | Fugu-Ultra interest down                                                                              | The later issue summary marks this earlier record as unverified; check it before accepting it |
| August 6            | iCloud Private Relay; Unit Economics of Software, depth up                                            | Original version/score-label consistency needs audit                                          |
| August 7, 12, 13–14 | HTMX forms; Roadmap decisions; HTML over WebSockets, depth up                                         | Exact intent retained; recorder blocked on historical route metadata                          |
| August 15           | Sol Ultrafast; Agent Plugins; DeepSeek Harness, depth up                                              | Some labels require chat plus original queue, not bundle alone                                |
| August 18–19        | Zero-knowledge proofs; disposable CI; Software Craftsmanship; Saggar; TermDOM, depth up               | Historical metadata blocked recording                                                         |
| August 21           | Slack Code; Waymo robocar chip; Fig, depth up; Better Batteries and Bun 1.4, interest down            | Five exact candidates, not five automatically accepted store entries                          |
| August 28           | Sass migration; AcceptMarkdown; Claude Cowork; Anthropic lab hardware, depth up; DuckDB interest down | Five exact candidates; preserve original versions                                             |
| September 1         | Matic robotics, interest and depth up                                                                 | Two dimension-specific records passed recorder; one article                                   |
| September 2         | Waymo, interest and depth up                                                                          | Two independent-axis labels for one article                                                   |
| September 3         | London robotaxis, depth up                                                                            | Preserve `maybe` interest; no inferred interest correction                                    |

Sources: [#35 discussion](https://github.com/Brad-Balfour/llm-wiki/issues/35),
[#66 discussion](https://github.com/Brad-Balfour/llm-wiki/issues/66), and the
[dated experiment log](../commute-experiment-log.md).

Several historical queues say `headline_only` at depth scores 0.60, 0.61, or
0.66; one says `interested` at 0.79. Under committed thresholds these are
violations of the scoring rules, which must be investigated before treating them as poor predictions. Brad’s correction can still be valid even when we cannot verify which scoring rules produced the original result.
Do not “fix” history by renaming `commute-route-v2` to `routing-rules.v1`.

Test possible rule changes in these areas before changing the live profile:

| Family                                                         | Supporting evidence                                                                          | Required counterexamples                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Robotics, physical AI, autonomous driving                      | Robots Cometh, Matic, repeated Waymo corrections and automotive preference                   | Routine hardware/finance coverage; do not infer all robotics items require depth                  |
| Practical agent engineering and usable techniques              | Codex selection, AI review, Agent Plugins, Slack Code, concrete implementation requests      | Generic launches, inaccessible tools, marketing without reusable methods                          |
| Software craft, frontend architecture, CI and product judgment | HTMX, WebSockets, CI, roadmap and craftsmanship corrections; Martin Fowler author preference | Narrow irrelevant frameworks and uninformative routine releases                                   |
| Whether a useful idea is also something Brad can use           | Fugu discussion, requests for advice Brad can put into practice                              | Useful conceptual lessons despite unavailable products; no mandatory third scoring axis yet       |
| Selective negative preferences                                 | Kimi, Bun, DuckDB, Better Batteries; routine Grok/open-weight coverage                       | Independent workflow, governance, product or science lessons that should overcome topic shorthand |
| Broader science, computing culture, tool awareness             | Original blind evaluation and profile 1.4                                                    | Generic platform/business news; author/company-name memorization                                  |

Unfamiliar titles such as Mole, fx, GlassBox, Vocab Break, Muse Image, Experiential,
Cohere Parse, and Wigolo are **presentation feedback** unless Brad explicitly corrected
an axis. Fig can have both a presentation observation and an independent depth correction.
The actual words override an assistant-generated `promote_to_in_depth` event.
“Skip,” “already heard,” “already wikied,” a wiki save, favorable discussion,
and silence are not automatic interest/depth labels.

## Required behavior and acceptance criteria

Priority levels: P0 is required first to establish reliable evidence and keep commutes working; P1 adds measured improvements; P2 is a separate experiment that needs its own approval. These priority levels are separate from the PR numbers in the implementation plan. Each ID maps to a
proposed PR in the implementation plan.

### R1 — Find every article and explain omissions (P0; #35, #66, #37)

Discover direct TLDR General, Dev, AI and Fintech deliveries for the requested
America/New_York date/range. Confirm sender and identifying TLDR text in the email body; subject alone is
insufficient. Keep the existing text-input fallback. Extract every editorial
item, excluding sponsors, quick-link ads, hiring/referrals and wrapper material.
Use source delivery date for filenames, including catch-up runs.

Acceptance: a complete newsletter test case checked by a person accounts for every block as
editorial, excluded with reason, or ambiguous for review. A private diagnostic
inventory records the first failed stage: discovery, parsing, URL resolution,
classification, validation, routing, duplicate removal, or rendering. Compare parsed articles against the separately prepared list of articles in the email; the parser cannot use its own output to prove it found everything. Checking only articles that reached the queue cannot establish completeness.

### R2 — Keep accurate records of each run (P0; #66)

The proposed private `classifier-candidate-manifest.v1` contains the run ID, source message and edition IDs, article title/summary/URL with private email details removed, parser
version and exclusion reason, classifier request ID, complete output,
validation errors, actual profile/prompt/provider/model/threshold/route versions,
content hashes, derived route, queue inclusion/exclusion reason, and included
filename/position. Keep observed original metadata alongside any later verified
interpretation; unknown means unknown. Record configuration and actual execution
separately. Avoid guessed model names.

Acceptance: the article counts match at every step from the email to the final results;
missing output is a recorded failure, never `uninterested`. Keep each attempt unchanged, including its retry history and file hashes. New run records must identify the files actually used; merely filling in a version field is insufficient. Diagnostic records and article inputs with private email details removed remain under `.private/`; no raw Gmail bodies or private work content are
saved in new files or committed to Git.

### R3 — Check the two scores and apply routing rules in code (P0; #35, #68)

Keep the fields and input-matching rules in [classifier instructions](../../schema/classifier-instructions.md). The classifier reports only interest and depth facts plus its request ID. It must not decide routes, Voice behavior, wiki destinations or whether to discard an article; application code makes those decisions.
Validate finite scores, labels, one result per input, forbidden fields and
score/label consistency before routing. Retain current thresholds until a
reviewed experiment changes them. Keep provider/model selection outside parser
and routing. `maybe` expresses optional interest, not model uncertainty.

Acceptance: reject malformed, missing, duplicate or inconsistent results and results with unknown IDs. Report the reason for each rejection. Limited retries never silently drop items.
Application routing includes both interested and maybe candidates under the
current queue rules. Do not silently limit the queue to a chosen number of articles.
Depth remains independently predicted even for uninterested items. An article’s classification may suggest it is useful for the wiki; only Brad’s explicit save request authorizes a wiki change.

### R4 — Verify feedback while preserving the original records (P0; #35, #66)

Retain exact user words, queue file hash, filename, item identity, URL, original
scores/labels and producer metadata, whether interest, depth or routing was corrected, date and source of
verification. Keep separate categories for verified corrections, corrections tied to specific articles whose old scoring policy is unresolved, unverified historical feedback, topic preferences, headline usefulness feedback,
duplicates/prior awareness, playback/platform incidents, wiki captures and
the assistant’s own summaries or interpretations. Preserve retractions and contradictory evidence.

Acceptance: import all discoverable later evidence in the table above once,
and record whether each correction was verified, rejected or remains unresolved. Revalidate against original queue and session files;
comments alone do not establish a private-store count. Save the verification result as a new record without overwriting originals. If the old routing policy is unknown, still record Brad’s explicit interest or depth correction. Do not claim that the old route was verified. No label affects live behavior until the tested
decision about using feedback in #68. Do not invent a corrected numeric score.

### R5 — Brad’s answers, a separate test set and measured adoption (P0/P1; #66, #68)

Create a reviewed July 28 coverage set, a correction dataset with duplicates removed, a
separate development set, and a new reserved final holdout. Gold labels come from
Brad before predictions are revealed. Keep articles already used or discussed out of the
final holdout. Preserve cross-edition instances for evaluation, while assigning
every copy of an article or related story to the same dataset.

Acceptance: record hashes of source, label, dataset-assignment and prediction files, and keep them unchanged during each comparison. Evaluate the current and proposed versions on identical inputs. Show tables comparing predicted labels with Brad’s answers, missed articles, unwanted discussion, errors near score thresholds, score distributions, playback time, queue sizes and results by newsletter and preference category. Run four weekly blind
review cycles and one final reserved evaluation. The test plan states which articles count in each measurement, how missing labels are handled, how proposed classifiers are kept from seeing test answers, costs, when to stop a failing trial and which decisions need Brad’s approval.
A justified no-change result is valid; better results on data used to revise the classifier are not sufficient to adopt v2.

### R6 — Remove repeated articles across a day’s newsletters and retain every source (P1; #36)

Collect all qualifying editions before rendering any queue. Resolve TLDR
redirects, normalize known tracking parameters conservatively, and group by final article URL across newsletters. Classify each article once for all newsletters that link to it,
retaining every source instance and its original title/summary and source order.
Two URLs on the same website are not necessarily duplicates. Preserve different paths and query parameters that change the article content.

Acceptance: fixed rules for choosing which source text to classify and which queue keeps the article, complete
source and version information, no second playback occurrence of an exact URL, regenerated positions,
totals and sweep text, and reruns that do not add duplicate entries. Record which articles were included, removed as duplicates and actually heard as separate facts. A replay request finds the retained article;
queue selection must work even if the first queue Brad opens had all duplicates
removed. Empty queues and late-arriving editions need explicit inventories and
revision rules, never silent replacement of files used by an active session.
Use a separate daily inventory file where possible; do not add fields to strict queue v3.

The issue's highest-interest, then highest-depth, then earliest-occurrence rule
applies to historical independently scored duplicates. When an article is classified once, every copy shares its scores, so retain its earliest newsletter occurrence using the recorded source order;
original source text remains available for a later “new context” request.

### R7 — Make short playback useful without changing depth labels (P1; #35/#66 quality feedback)

Test whether a short, literal newsletter description gives useful context for
unfamiliar names while preserving `headline_only`. This is a test of the text prepared for playback, not a reason to classify every unfamiliar product as `in_depth`.

Acceptance: compare existing headline-only playback with a short excerpt copied exactly from the newsletter, measuring usefulness and added seconds separately from classification.
Do not generate explanatory facts from a product name. Preserve full description
and exact attribution or `null`. Any changed `playback_text` template requires a
new queue version and coordinated changes to queue generation, the schema, file readers and Project instructions; current
v3's literal template must continue to validate unchanged historical files.

### R8 — Keep queue delivery and fallback usable from the phone (P0/P1; #37, #36)

Keep generating queues in the existing Project, with manual generation using the same prompt as the fallback. A replacement must demonstrate both unattended email retrieval and delivery that works through the phone and Project. Initially, local classification is for comparison only. Local
processing plus recurring download/re-upload from a home computer is not an acceptable permanent workflow.

Acceptance: real parseable dated JSON `.txt` downloads for every qualifying
edition, explicit failures/missing editions, retries that do not create duplicate files or entries, and no
success based only on scheduler status. Retain the manual fallback until three
consecutive qualifying scheduled weekdays succeed. A cloud/API replacement is
conditional on proving delivery; do not assume a supported way to add files automatically to Project Library exists. Production source updates list exact files and verified
live versions and support rollback without rewriting past queues.

### R9 — Separate the playback text from article details and test it in Voice (P1; #100, #120)

Generate two JSON files per newsletter queue. The main file is deliberately small:
it contains only the opening sweep and the exact text to read for each item.
Move all other data into a matching file with `-reference` immediately before the
extension. For example:

- Main: `20260907-tldr-dev.txt`
- Reference: `20260907-tldr-dev-reference.txt`

Both files contain JSON; `.txt` preserves the current download convention. The
main file has exactly this shape, with `sweep_playback` written first and an
`items` array containing N entries:

```json
{
  "sweep_playback": "1 of 2. Headline only. Example one\n2 of 2. In depth. Example two",
  "items": [
    {
      "item_playback": "1 of 2. Headline only. Example one"
    },
    {
      "item_playback": "2 of 2. In depth. Example two\nThe exact newsletter description for example two."
    }
  ]
}
```

There are no other fields in the main file or its item entries. In particular,
do not add IDs, scores, separate titles, depth labels, descriptions, URLs, author,
publication, version fields or hashes. Titles and reading modes can occur within
the prepared spoken strings, as they do today. `item_playback` is the name for
this new format; generate its value from the existing `playback_text` without
changing the spoken text in the first trial.

The reference file retains all the information needed for article questions,
feedback and export: source and item IDs, titles, URLs, descriptions, interest and
depth scores and labels, routing, author/publication, source details and versions.
It also records the main filename, a hash of the main file, and the item positions
that link its records to the main array. All extra matching and validation data
belongs here, so the main file stays small. Generate and check both files together;
never silently replace one file from a pair already used in a session.

Change the Voice prompt to make these instructions explicit:

1. At the start, open only the main file. Read `sweep_playback` exactly.
2. On each next-item advance, read only that entry’s `item_playback` exactly.
   Keep the current array position for next, back and jump commands. Do not
   assemble text from other fields, summarize it, or add an explanation.
3. Open the matching `-reference` file only when Brad asks for additional article
   details. Match the current position to its reference record; use its URL if
   the question requires reading the source article. If the reference is missing
   or does not match, say so rather than guessing.
4. After answering, return to the main file for default playback. Having opened
   the reference file is not permission to use it instead of `item_playback` on
   later advances. Do not preload it for the sweep or ordinary navigation.

Session export still needs the complete queue and exact item identities. The
export step must combine the matching pair when producing the final bundle; this
is separate from loading article details into the default Voice reading context.
Keep this file-joining work in the export instructions/tooling, not as a reason
to open the reference file at session start. Preserve one queue per session,
exact saves and corrections, and existing recovery behavior.

This is the concrete experiment suggested in
[#120’s September 4 comment](https://github.com/Brad-Balfour/llm-wiki/issues/120#issuecomment-5548380533)
and clarified by Brad during review of this plan. The hypothesis is that fewer
fields available during default playback will reduce invented or summarized text.
It is not established that this will fix Voice’s behavior. Prompt 4.2 and a
single v3 file still had failures on September 4.

Acceptance:

- Generate the exact two-field main object and one-field item objects above.
  Check item counts, order, literal strings, reference positions and the main
  file hash in the reference file. Reject extra fields in the main file.
- Test missing, swapped, stale, reordered and mismatched reference files. Opening
  a reference must not change which article is current. Check that both files
  are available in the same Project from the phone.
- Compare the current single file against the two-file version with identical
  scores, article order, sweep and item text. Keep the short-description trial
  in R7 separate so a result can be attributed to the file split.
- Test actual iPhone Voice through a long session: opening sweep, next/back/jump,
  pauses, restart, a details request that opens the reference, and a return to
  several ordinary advances. Check that the main file supplies default playback
  before and after the details request. Record any inability to verify which
  files Voice opened; its claim that it followed the prompt is not proof.
- Count unrelated additions, paraphrases, omitted text and failed first exports.
  Check that an exported bundle includes the complete queue and preserves saves
  and feedback, including a session with no article-details request.
- Give the pair a new file-format version, recorded in the reference schema and
  generator configuration rather than extra main-file fields. Update generation,
  validation, bundle reading/export and Project instructions together. Keep old
  v2/v3 files readable and restore single-file v3 generation if the trial fails.

A reconstructed bundle that passes validation does not prove what Voice said.
A desktop text test does not prove that a test program can control or observe
actual iPhone audio. Manual iPhone testing remains required.

### R10 — Keep PRs small and measure time and cost (P0; user request)

Use focused PRs with a stated base branch, required earlier PRs, test results, sample
before/after output and rollback. Preserve valid command behavior and fail early
on invalid CLI arguments/private paths (#94). Keep parser, scorer, routing,
renderer, delivery and Voice changes independently measurable.

Acceptance: automated CI checks run without network access, using invented test data that contains no private information;
paid/private replay is an explicit separate run. Record per-stage wall time,
retries, model usage/cost when available, and human labeling time. Time outside tool calls includes the agent’s reasoning and coordination work; it is not a direct measurement of model computation. #85 abandoned Terra for commute
maintenance; that evidence neither selects nor disqualifies an article-scoring
model. No merge or live update occurs without Brad's approval.

## Related work kept separate

[#26](https://github.com/Brad-Balfour/llm-wiki/issues/26) explains why source and version information
must remain available after queue changes so wiki updates can still use the actual source articles; it does not justify
auto-saving articles. #48, #95 and #96 remain tasks for wiki updates and session-file processing,
with compatibility tests where needed. #8, #52 and #112 are independent Pages,
search and workspace work. #85/#119 supply operational lessons without making
all commute timing measurements a prerequisite. Related-story automatic suppression,
unattended cloud migration, a custom Voice client, third-axis scoring, model
fine-tuning, and combining several providers’ predictions every day are not included in the initial v2 work.
