# Classifier v2 implementation and validation plan

Status: proposed; this PR contains planning only. The
[requirements](requirements.md) define R1–R10 and the
[evidence inventory](evidence-inventory.md) accounts for every open issue.
No model experiment, live Project edit, mailbox change, or use of a new implementation
has happened as part of this plan.

## Recommended sequence

First add records that explain omissions and tools to rerun old newsletters. Keep Monday’s existing queue generator available. Compare possible scoring changes on the old newsletters before choosing one. Add daily exact duplicate removal and
short-playback improvements as separately reviewable product changes. Retain
the existing iPhone Voice app. Whether it reads the queue correctly needs a separate test.

This makes the system more useful before the four-week scoring experiment ends:
missing-item explanations, accurate records of the versions used, reusable labeled data,
repeatable queue checks, and eventually fewer duplicate announcements. Brad can review and approve each improvement separately.

## Monday, September 7, 2026

The first priority is a usable commute, not declaring a newly trained v2 ready.
The current Task is recorded as weekdays at 11:00 AM America/New_York. This is
an afternoon-queue path; it cannot promise Monday morning's new editions.

1. Before Monday, preserve available historical article titles, summaries and URLs with private email details removed and
   record the current files and settings. Do not wait four weeks while messages
   remain in Trash. Search results already establish available candidate IDs;
   body confirmation and extraction are the next implementation steps.
2. Keep current profile 1.4, classifier instructions v1, routing v1, queue v3,
   Voice Prompt 4.2 and export source in the live Project. Do not introduce a
   partially updated file format before a drive.
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

5. Check real downloads, edition coverage and identity. When the local tools are available, the agent checks files with the existing command:

   ```sh
   npm run validate:commute-queue -- /absolute/path/20260907-tldr.txt
   ```

   Repeat for each supplied edition. These checks do not currently run automatically on the phone. A failed file must be regenerated with the
   same files used by the current version; do not silently patch its scores, label source and version information or
   date to make it pass. Keep any valid editions independently usable and report
   the missing/failed ones. A sparse queue triggers all-article inspection,
   not an invented minimum item count.

6. If the PR that adds a diagnostic file has already passed review and a manual comparison run,
   collect its private inventory alongside the current queue output. Otherwise retain the
   Monday input as a named replay run once that tool exists. **Neither blocks
   the commute.** Do not attach experimental candidate queues under the live
   filenames or silently feed Monday corrections into the profile.
7. Capture exact corrections and separate playback incidents after the commute.
   Articles heard on Monday can be used for development or weekly review, not an untouched final
   holdout. If Monday is chosen as a reserved test, save predictions first and collect Brad’s labels without showing those predictions; default to later unseen dates
   for the final test so the commute is not delayed.

This document plans Monday’s fallback; it does not schedule a run or change the existing Task. Those actions follow review of the relevant PR.

## How the parts fit together

```text
Current daily workflow:
Gmail -> existing ChatGPT Project -> dated queue-v3 files -> iPhone Voice
  -> session bundles -> proposed wiki changes in a PR

Proposed local comparison:
confirmed email text -> extract articles and list exclusions -> clean article URLs
  -> record every article -> save classifier inputs without private email details
  -> score articles -> validate results -> apply routing rules in code
  -> optionally remove exact daily duplicates -> generate queue-v3 files
  -> validate files and report results

Learning from feedback:
original queue + Brad’s words -> verify corrections -> private reference labels
  -> separate development, weekly and final-test datasets
  -> compare current and proposed versions -> review the adoption decision
```

The Project remains the program producing daily queues until an end-to-end replacement
has demonstrated that it can deliver usable files to the phone. Initially import fixed Project predictions into the
comparison program; this enables checks of article completeness, routing and queue text without building
provider integrations or paying for calls. A local scoring integration is a separate
experiment that needs a separate decision, as required by #68.

Proposed private files. These formats still need review; there are no commands for creating them yet:

| File format                           | What it records                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `source-inventory.v1`                 | Confirmed editions, message and article-block IDs, expected article/exclusion counts; no raw email body                             |
| `classifier-candidate-manifest.v1`    | Every article, its final outcome, each processing attempt, and recorded versus verified versions                                    |
| `classifier-evidence-adjudication.v1` | Corrections and verification results added without changing earlier entries; source-file hashes and whether the old policy is known |
| `classifier-evaluation-split.v1`      | Dataset hashes and fixed assignments; related-article groups; prior use in training or discussions; random sampling seed            |
| `classifier-evaluation-run.v1`        | Saved inputs and predictions, actual model settings or unknown values, prompt/profile hashes, repeat-run IDs, results and timing    |
| `tldr-day-manifest.v1`                | Every edition and source occurrence, matching-URL groups, retained/removed queue occurrences, queue hashes and generation version   |

Use the existing feedback-label.v1 store for compatible exact labels. Preserve
historical corrections with unknown routing versions in a separate verification file. Do not add route names to v1 without knowing what they meant. A report may compare their verified interest and depth corrections while marking the historical original route unverified.

For new runs, compute metadata outside model output when a local program runs the classifier. Project-side declared versions must be checked against the exact uploaded files; unsupported model/effort details remain unknown, not invented. Record a fresh run of the current Project separately from a run that applies the repository’s rules.

Queue v3 has strict fields. Keep the source and version details needed for duplicate removal in a companion file first;
if replay/reference access needs file reader changes, design and test the file-reader update before adopting the feature. Do not add fields that v3 does not allow. The two-file design in R9 needs a new format: the main file contains only `sweep_playback` and an array of `item_playback` strings wrapped in one-field objects; all other data goes into the matching `-reference` file. Record the format version in the reference file and generator settings. Keep v2/v3 support in file readers and session bundles. An altered headline-only template is a separate R7 experiment.

## Reviewable PR sequence

These are proposed PR identifiers, not already-open GitHub PR numbers. Default
branches below use `agent/classifier-v2-*`; select final names at implementation.
Keep each PR focused on one behavior, usually a few production files plus focused
test cases. Split a row further if schema, runtime and integration changes become
hard to inspect together. Build each PR on the earlier changes it actually needs.

| PR                                                | Builds on                                                 | What Brad reviews                                                                                                                                                                                                                                      | Required result and how to undo the change                                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 — this plan                                    | `main`                                                    | Requirements, issue findings, test plan and proposed PR order in `docs/classifier-v2/`                                                                                                                                                                 | Agreement on the plan; no live change to undo                                                                                                                                                                                                                                                                   |
| P1 — explain omissions and errors                 | `main` after P0                                           | Source and article inventory formats, validators, parser records in `src/tldr/`, invented omission/exclusion test cases, and optional Project instructions for diagnostic output                                                                       | R1/R2: one complete real private inventory; every July 28 article accounted for; matching source counts. Stop collecting the extra file to undo; scoring stays unchanged                                                                                                                                        |
| P2 — verify historical feedback and versions      | P1                                                        | Verification file format and import/report tools beside `src/classifier/feedback-label.ts`; all recorded corrections, withdrawals and version mismatches                                                                                               | R2/R4: preserve originals; repeated imports add no duplicates; never guess unknown policies; no use of feedback in live scoring. Stop the importer and keep the saved records                                                                                                                                   |
| P3 — blind labeling and comparison report         | P2                                                        | Dataset assignments, private labeling page, result comparison, import of older labels without guessing missing depth, and separately saved Project predictions                                                                                         | R5: complete July 28 reference labels, reserved final test set, report distinguishing the five original processing steps: parsing, classification, validation, routing and queue inclusion, tests for exposed predictions and articles shared between datasets. Stop the experiment; current scoring stays live |
| P4 — generate queue-v3 files in code              | P1, or `main` after P1 merges                             | Queue generation in `src/commute/`, using existing validation and routing; no model calls; expected output from known inputs; accurate version records                                                                                                 | R3/R9: exact playback strings, score thresholds, order, unknown author/publication values, missing-result failures, and queue-to-bundle checks. Keep generated files for local tests only                                                                                                                       |
| P5 — optional local classifier                    | P3 and P4 merged; separate approval to test local scoring | One interface for model providers, one provider implementation, limits on batch sizes/timeouts/retries, private saved predictions and proposed commands                                                                                                | R3/R5/R8: same saved inputs, actual provider/model records, invalid results excluded with reasons, cost/time and comparison with Project predictions. Return to saved Project predictions; no change to daily queue generation                                                                                  |
| P6 — four-week scoring experiment                 | P3; P5 optional                                           | Saved experiment settings; 2–4 proposed profiles/prompts per selected error group, outside the live schema files; weekly reports with private details removed                                                                                          | R5: four weekly blind reports and a final test-set decision. Live scoring stays unchanged; keeping the current rules is a valid result                                                                                                                                                                          |
| P7 — adopt a measured scoring improvement         | P6                                                        | OpenSpec requirements for the selected profile, prompt, thresholds or use of feedback; replacement of old holdout instructions where P3 has not already done so; regression tests and related version records                                          | R3/R4/R5/R8: agreed limits, Brad’s approval, manual comparison, then one real edition before the others. Restore the previous source files and recorded versions if the trial fails                                                                                                                             |
| P8a — remove exact daily duplicates in code       | P4 merged                                                 | URL cleanup, daily inventory and duplicate-removal code; rules for choosing source text and retaining every source; empty-queue and late-delivery tests                                                                                                | R6: no repeated exact URLs, no unrelated article removed from the reviewed test groups, stable IDs on repeat runs. Disable duplicate removal to undo                                                                                                                                                            |
| P8b — try daily duplicate removal in the Project  | P8a                                                       | OpenSpec and Project instructions: find all editions first, classify each matching-URL group once, generate the queues together, and specify exact files to install                                                                                    | R6/R8: manual comparison on identical inputs, phone access and replay, then a scheduled trial. Restore the current per-edition generator if needed. This can proceed while P6 tests scoring                                                                                                                     |
| P9 — test more useful short playback              | P4 merged; independent of scoring                         | New queue template and schema version if needed; generator, validator and bundle-reader updates; short excerpts copied exactly from the newsletter; matching Project files                                                                             | R7/R9: no inferred depth changes, blind usefulness/playback-time comparison and iPhone test. Restore v3 generation and Project files; retain support for older files                                                                                                                                            |
| P10 — generate and test the two-file queue        | P4 merged; independent of P9 and scoring changes          | R9’s exact main-file shape (`sweep_playback`, `items[].item_playback`); all other data in `-reference`; pair checks; prompt that opens only the main file at start and the reference only for requested article details; existing export compatibility | R9: identical-text comparison on iPhone, including default playback after a details request; correct item matching; complete exports with and without reference questions. Restore single-file v3 if needed                                                                                                     |
| P11 — related-story notes or replacement delivery | Separate decisions based on test results                  | Two separate follow-ups: mark similar stories after exact duplicate removal; or test unattended Gmail/cloud processing with working mobile delivery                                                                                                    | R6/R8: do not automatically remove similar stories without measuring mistaken matches; do not switch the daily generator until the whole process works through the phone. Neither is needed for initial v2 adoption                                                                                             |

P1 can add diagnostic records to the local parser and an optional request for a diagnostic file from the Project. Local parser changes do not change a scheduled Project Task; record which program produced each inventory. P3’s dataset plan must
update the relevant OpenSpec holdout clauses before dataset tuning starts; P7 then
adds only changes to live behavior. Keep #66 open until its real dataset and
results for the current version are complete.

PR dependencies:

```text
P0 -> P1 -> P2 -> P3 -> P6 -> P7
       |           |     ^
       +-> P4 -----+-> P5 (optional)
            +-> P8a -> P8b
            +-> P9 (short-description trial)
            +-> P10 (two-file queue trial)
P11 follows the relevant measured decision, not the calendar.
```

In practice, keep at most two or three unmerged dependent PRs. A child PR targets
its immediate parent branch so Brad sees only the new changes. Once a parent merges,
rebase the child onto updated `main` and retarget it; verify the diff contains no
parent commits. Shared dependencies on two stacks should merge before opening the
integration PR. Each description names requirements, parent PR, one before/after
example, repeatable checks, private experiment evidence and live deployment
steps. Review code/schema/prompt behavior once at the latest complete commit;
merge only after Brad approves. Approving this plan does not approve live changes.

### Additions from the detailed commute log review

The [log review](commute-log-review.md) records the evidence and scope decisions.
Keep these additions in the existing small PRs:

- **P1/P4:** check extraction of explicitly supplied author/publication values;
  distinguish missing source data from a parser miss and preserve `null` when unknown.
- **P2:** verify corrections against full recorded conversations and original
  downloads, including retrospective corrections. Count repeated representations
  once. This improves dataset collection without changing Voice’s export process.
- **P3/P6:** include Addy Osmani’s author preference and self-driving interest
  including Tesla. Test author-aware rules against topic-only rules, missing
  attribution and other authors; do not turn an author preference into a depth label.
- **P9:** compare unchanged playback, context for every short item, and context
  only for unclear titles. Include clear headlines as a comparison group.
- **P10:** produce the main and `-reference` files together with a shared prefix.
  Preserve already-working access to the original description on request. Keep
  export compatibility limited to what the new file format requires.

Siri/phone-call settings, export retry handling and other commute workflow fixes
are not added to the classifier PR sequence.

## Rerunning old newsletters and collecting Brad’s answers

### Collect the newsletters and keep the final test separate

The read-only search found 85 recent Trash candidates and 10 July 27–29 candidates,
not a verified dataset. Read every page of search results and verify direct sender, body
markers, delivery timestamp and edition type. For the July 28 coverage exercise,
retrieve the exact day across all four newsletter types and record editions that
are absent. Do not use an existing queue to reconstruct an unavailable newsletter; the queue may omit articles.

For reruns, extract article data from confirmed newsletters without saving the raw email bodies. Save article records with private email details removed, plus reasons for exclusions or review. Preserve those records unchanged under `.private/classifier-v2/`. Do not restore, relabel or delete mail
as a side effect. A Gmail API path must include Trash explicitly; a connector
must demonstrate that its Trash query actually returns the targeted messages.
Gmail deletes messages after 30 days in Trash, so this is the first collection task. [Google deletion policy](https://support.google.com/mail/answer/7401),
[API listing option](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list).

Inventory historical private queues, session bundles already collected, attempted labels and exact
shared-chat evidence by identity before importing. Use existing sanitized copies
where available; never rewrite previously processed historical files. July 28 is a
known diagnostic development set. August and September heard/discussed material
is useful for reruns and tests of previously reported problems unless a check for prior use of the articles proves otherwise.

### Fix the datasets before testing and collect answers independently

1. Inventory original 262 training, 41 June 30 and 98 July 1–2 records. They are
   known development/calibration history now. Preserve legacy labels as legacy;
   an old single-axis `down` cannot supply an unobserved depth label.
2. Build the complete July 28 reference dataset by asking Brad for both axes for every
   editorial item. A source-confirmed omitted item is not a reference example until Brad labels it.
   Present source title/summary/link with predictions and rationales hidden.
3. Form development and weekly review pools from known history and new articles Brad has labeled. Include every exact correction, every candidate from unusually
   sparse days, a seeded random skip sample, close-to-threshold samples (interest
   0.55–0.65 and 0.75–0.85; depth 0.55–0.65), and a comparison sample of predictions that have been verified and are far from the thresholds.
4. Choose final holdout by entire unseen delivery dates, with all copies of the same article and related stories assigned to the same split. Preserve
   distinct newsletter instances inside their split. Exclude groups already
   present in training, prompts, wiki discussions, issue examples or reviewed
   development outputs. If the historical pool is contaminated, collect later
   fresh dates; lack of clean material delays adoption, not the commute.
5. Proposed planning target: at least 100 final-holdout editorial instances from
   at least three delivery dates covering all four newsletters when available.
   Aim for at least 20 interested items and 20 in-depth items, according to Brad’s answers, before drawing conclusions; rare topics are reported as insufficient evidence.
   These proposed minimums do not guarantee enough data to detect a real improvement.
   Choose the test dates before seeing labels. If too few examples remain in a category, report the result as inconclusive and plan another test rather than choosing dates that favor the result.
6. Save the current and proposed versions’ predictions in files that will not be changed
   **before** Brad labels each blind batch. The labeling page must not receive prediction values, even in hidden page data. Collect independent interest and depth,
   optional reason and an explicit unsure/missing response. Do not force numeric
   scores from Brad. Save progress/resume without exposing earlier predictions.
7. When generating predictions, provide only the allowed profile, prompts and article inputs with private details removed. Use fresh model sessions with no issue feedback, saved answers or this research conversation. The scoring model can read final-test articles to predict their labels. The person or agent revising the rules must not inspect those articles, answers or error reports before final scoring.
8. Record hashes of the label files, then compare. A final holdout whose errors are inspected
   becomes development data for the next revision. Do not tune and report a
   second run on it as fresh validation.

Combine the separate Matic and Waymo interest/depth corrections into one reference answer per article, retaining both feedback sources. Two corrected scores for one article do not count as two tested articles. If Brad corrects depth only, do not count the original interest prediction as a confirmed answer. For each measurement, state how many articles have the required labels.

### Compare one change at a time over four weeks

Compare (A) observed current Project version, (B) replay using the repository’s rules with the same
fixed predictions, and optionally (C) one fixed local scoring configuration.
A versus B isolates validation/routing/rendering differences; A versus C is a
producer/model comparison, not proof that a profile alone improved. Save all
configurations and actual observed metadata. Unknown Project runtime details
limit reproducibility and must be stated in the report.

Choose the groups of errors that caused the most problems first. For each compare 2–4
alternatives: rule tied to named examples, a general rule that explains Brad’s preference, overly
broad rule, and unchanged/threshold-only comparison where useful. Keep interest rules unchanged while evaluating depth rules and vice versa where feasible. Do not
change provider, thresholds, duplicate removal and playback policy in the same scoring
comparison. #68 calls this the “weakest valid revision” experiment: prefer a rule that works across more topics without adding errors, needs fewer exceptions, and still makes sense when company and product names are removed. The research behind that idea does not prove it will work for newsletters, and shorter wording alone is not the goal.

Once P3's dataset is ready, run four weekly blind reviews. If ready September 7,
provisional weeks are September 7–13, 14–20, 21–27, and September 28–October 4;
otherwise shift the entire window. Proposed weekly review size is 20–30 items
plus exact corrections and sparse-day coverage, with Brad's measured labeling
burden reported. Weekly feedback may refine development candidates under the test plan, while leaving the live classifier unchanged. Choose and save the final candidates before opening final test
predictions/labels. Do not repeatedly tune against the reserved final holdout.

Repeat model scoring three times on a fixed set of difficult development examples to expose
instability; retain every run rather than selecting the best run. For the
final comparison, use the method for repeating and combining results agreed before testing (recommended:
three independent runs, report mean and range plus each run's failures). Replaying saved predictions must give the same output each time. Asking the model to score articles again can give different results.

### Measurements and proposed requirements for adoption

These proposed limits need agreement in P3 **before** predictions are evaluated.
They are not previously approved user preferences. Keep the requirements for complete, accurate records
regardless of tuning; if thresholds prove too strict, amend a future test plan
before testing on new holdout data, not after seeing the desired result.

| Measurement                      | Definition and proposed requirement                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Article completeness             | Compare articles listed independently from the email with parser output. No unexplained omissions in reviewed test cases or complete final-test editions                                                                                                                                                                                                             |
| Accurate records and valid files | Accept no invalid file, guessed source/version claim, silently missing ID, or leaked private/final-test data. Any such failure stops adoption                                                                                                                                                                                                                        |
| False skips                      | Brad labeled the article interested or maybe, but the model labeled it uninterested. Report counts and rates among articles Brad wanted, separated by his interest label and the prediction’s distance from the threshold. No increase over the current version and no new skip scored below 0.50 for an article Brad labeled interested                             |
| Missed depth                     | Brad labeled an article in-depth but the model chose headline-only. Measure only where Brad supplied a depth label. Report both errors among included articles and total missed in-depth articles, including skipped ones. No increase over the current version                                                                                                      |
| Unwanted discussion              | The queue includes an article as in-depth, but Brad labeled it uninterested or headline-only. Keep this separate from interested-versus-maybe disagreements. Allow at most one additional case per 100 labeled articles                                                                                                                                              |
| Weighted error score             | Assign 5 points for skipping an interested article, 3 for skipping a maybe article, 2 for unwanted discussion, and 1 for missing depth on an included article. Count only the highest applicable penalty per article. Agree on these weights before testing. New scoring rules must lower the mean penalty on the final test set; keeping the current rules is valid |
| Score agreement                  | For interest and depth separately, show a table of predicted versus Brad’s labels, score distributions and errors near each threshold. Exclude missing depth answers from the depth calculation. Do not treat the model’s scores as calibrated probabilities; any reliability chart is descriptive                                                                   |
| Playback time                    | Estimate reading time at 150 words/minute. Show the opening sweep and default article text separately from possible discussion time (for example, 2 or 5 minutes per in-depth article). Proposed added default-reading limit: 10% or two minutes per day, whichever is larger. Measure actual discussion time separately                                             |
| Duplicate removal                | Remove no unrelated articles and retain every source in the manually reviewed test groups. Report classification results both per newsletter occurrence and per unique article so repetition does not make the evidence look stronger                                                                                                                                |
| Performance on other topics      | Show results by newsletter, date and preference category; test rules with company/product names removed; list exceptions and changed predictions. Mark small groups as uncertain. When estimating uncertainty by resampling, keep related dates/stories together                                                                                                     |
| Time and cost                    | Report time per edition/article, retries, failures, measured model usage/API cost when available, and human review time. Set a budget from the current version’s results before the trial. Do not invent prices or infer model computation time from total task time                                                                                                 |
| Delivery                         | A manual run in the same Project must create valid files usable from the phone. Keep the manual fallback unless scheduled generation works on three consecutive qualifying weekdays                                                                                                                                                                                  |
| Voice playback                   | Test actual iPhone Voice in a long session and report text mismatches and export failures separately. Better scores do not close #100. Claim improved playback reliability only after a trial with no unrelated additions or missing default text                                                                                                                    |

Report counts and paired changes alongside percentages; do not hide hard failures
in averages or claim statistical certainty from a small holdout. A candidate
must meet the requirements for accurate records, acceptable errors and playback time before preference for broader
coverage or lower cost matters. Record the numeric acceptance limits and file hashes
in the test plan PR. Stop a proposed classifier’s trial immediately if it repeatedly causes a serious new missed-article problem. Do not automatically change the global thresholds in response.

## Trying the changes and checking the results

For each PR that changes code with fixed, repeatable results, run its focused tests, then `npm run check`, `git diff --check`, and strict OpenSpec validation for the requirements it changes. P1/P3 and changes to the commute workflow (J1–J6) must validate both existing OpenSpec changes and the new one. CI uses invented test cases, not Gmail or paid model calls. Keep private rerun results private. Commit only reports with private details removed and regression examples from datasets allowed for development.

After Brad approves new scoring rules, check a manual rerun in the same Project,
try it on one real edition, then all editions, then assess scheduled operation.
Record exact live files installed and verified content/version hashes; merging a PR does not update the files in the live Project. For each release, record how to restore the previous profile, prompt, thresholds, routing rules, queue schema, generator and model settings together. Do not overwrite or relabel old generated
queues. Restore the previous version if records become unreliable, substantially more articles go missing, or delivery gets worse. Retain the failed run for investigation.

Headline context, duplicate removal and two-file queue trials keep scoring unchanged.
P10 can begin after P4; it does not wait for P9 or the four-week scoring experiment.
Use the exact JSON shape and filename pair in [R9](requirements.md#r9--separate-the-playback-text-from-article-details-and-test-it-in-voice-p1-100-120).
Build it in two reviewable steps, splitting into dependent PRs if needed:

1. Add pair generation and validation, plus the minimal compatibility changes
   needed to preserve complete queue data in the existing session export. Check
   that the main file contains no fields beyond the sweep
   and per-item playback strings. Keep version, position-matching and hash data
   in the reference file. Preserve old v2/v3 readers. Generate both files from
   one queue in the same run, with a shared filename prefix, and confirm both
   downloads work in the same Project on the phone.
2. Update the Voice and export instructions, then run the iPhone trial. The Voice
   prompt opens only the main file at start, reads the sweep and item strings
   exactly, and opens `-reference` only for requested article details. The export
   compatibility test checks that complete queue data, saves and corrections
   survive the file-format change. It does not redesign session exports or retries.

Compare single-file v3 and the pair using **identical scores, order and spoken
text**. Include a long sequence of ordinary advances, a details request, and
several more advances to check whether Voice returns to reading only the main
file. Test next/back/jump, missing or mismatched reference files,
and exports both with and without a prior details request. Record wrong text,
paraphrases, missing text and failed exports. If actual file loading cannot be
observed, report that limit rather than claiming the prompt enforced it.

Keep the R7 short-description change out of this comparison. Restore the previous
generator and Project instructions if the pair fails. Do not build an autonomous
iPhone test program until actual audio control and observation are demonstrated;
manual iPhone testing remains part of the plan.

## Decisions for review

The recommended defaults are: queue generation in the Project with a manual fallback for Monday; rerunning saved historical inputs first; no automatic scoring changes after feedback; interest and depth still scored separately;
new clean holdout and four weekly cycles before adoption of new scoring rules; exact daily
URL duplicate removal before automatically removing stories judged similar; separate short-description and two-file queue trials. The two-file trial uses a playback-only main file and a `-reference` file opened for requested details, and can proceed independently of scoring changes. The proposed sample sizes, error weights and playback-time limit
need agreement in the test plan PR. Decide where classification will run only after measuring its value and confirming that files reach the phone. No paid provider choice or hosting
commitment is required to approve the initial work on omission and error reporting.
