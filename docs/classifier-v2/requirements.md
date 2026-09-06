# Classifier v2 requirements

Status: agreed direction, written for implementation review. This PR changes the
plan only. The purpose is to make Brad’s 90-minute daily commute a useful way to
keep up with developments in his industry, with less repetition and fewer errors.

There are five improvements, R1–R5. R6–R8 preserve the working product. The
[implementation runbook](implementation-plan.md) names the PRs, files, checks and
live installation steps. The [evidence inventory](evidence-inventory.md) and
[commute findings](commute-log-review.md) link the feedback behind these requirements.

## Part 1 — New improvements

### R1 — Produce separate playback and reference files

For each newsletter, produce both JSON `.txt` files in the same generation run
with the same filename prefix:

- `20260907-tldr-dev.txt`
- `20260907-tldr-dev-reference.txt`

The main file has exactly these fields, with `sweep_playback` first:

```json
{
  "sweep_playback": "1 of 2. Headline only. Example one\n2 of 2. In depth. Example two",
  "items": [
    { "item_playback": "1 of 2. Headline only. Example one" },
    { "item_playback": "2 of 2. In depth. Example two\nThe original newsletter description." }
  ]
}
```

No scores, IDs, URLs, descriptions, schema versions or other metadata go in the
main file. Item numbers and modes are already written into the playback strings.
All other queue data goes in the reference file, including descriptions, titles,
author/publication, URLs, scores, source identities, versions and duplicate
relationships. Reference entries match the main array by position. Record the
main filename and a SHA-256 hash of its canonical JSON in the reference file so a
checker can detect a swapped or stale pair. Hash the UTF-8 bytes of
`JSON.stringify(parsedMain)` with keys in the required order. This also lets an
exported snapshot be checked without depending on indentation. Generate the hash
with the Project’s code tool, not by asking the model to invent it.

Voice opens only the main file to start, reads the complete sweep, and reads the
stored item string on each advance. It opens the matching reference only for
requested article details, then returns to the main file for ordinary playback.
Next, back and jump retain their current meaning. An original-description request
reads the full literal description from the reference; this behavior already exists.

At session export, read the matching reference if necessary to preserve exact
article identities, saves and feedback in the existing self-contained bundle.
That export step is not a reason to preload the reference for ordinary playback.
The runbook defines the snapshot representation and reader changes. Keep old v2/v3
queues and their exports readable.

Acceptance: check the pair’s shape, counts, positions, hash and complete exported
data. Reject a mismatched pair. Simulate short and long historical queues on
GPT Live, including a details request followed by ordinary advances and an
export with no prior details request. Compare actual speech with the prepared
strings. Brad judges whether the result is no worse than the current experience.

### R2 — Fill author and publication during generation

Before classification, use attribution in the newsletter when available. For
missing information, the generation LLM uses its browsing tools to read the
original, unwrapped article URL. It can read page metadata and the visible
byline; it must not guess an author from a person mentioned in the article.
Perform one lookup per distinct article URL, reusing it for duplicate copies.

New reference entries contain nonempty author and publication strings:

| Result                                  | Required value                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Author or authors found                 | The published author names, including an organizational byline when that is what the page lists |
| Article read but no byline found        | `No authors listed`                                                                             |
| Article could not be read after a retry | `Author lookup failed`                                                                          |
| Publication name available              | The publication/site name                                                                       |
| No publication name extracted           | The hostname of the resolved article URL, without a leading `www.`                              |

Do not emit `null` for these fields in new v4 output. In the reference, also
record whether attribution came from the newsletter, the article page, a
hostname fallback, an absent byline or a failed lookup. This distinguishes an
access failure from a page that names no author. Retain the actual resolved URL.
One inaccessible page must not prevent other articles or editions from being
produced. A failed lookup does not itself change interest or depth.

Pass verified attribution into classification so author preferences can be used.
An error/status string is not an author. Use the same generation LLM and tools
already running in the Project; this requires no separately selected model,
service, API integration or Mac process.

Acceptance: inspect examples with a newsletter byline, a byline found only on the
article, multiple authors, no byline, and an inaccessible page. Check publication
fallbacks against their URLs and verify that new files contain no null attribution.

### R3 — Remove repeated coverage across all of a day’s newsletters

Retrieve all qualifying General, Dev, AI and Fintech editions before generating
queues. Resolve tracking links, group identical destination URLs, and retain all
newsletter occurrences and their original descriptions. Different article paths
or meaningful query parameters must not be collapsed by URL cleanup.

Classify each distinct article URL once. Then compare different URLs for coverage
of the same event or announcement. Use the article titles and descriptions;
consult the sources when needed to decide whether another item adds useful
information. Sharing a topic or company is not enough to call two items duplicates.

- Play repeated coverage once across the daily queues.
- Keep materially new information as an update. Prepare the update explanation
  during generation; Voice reads the stored text rather than inventing it.
- If the relationship is uncertain, retain the item and flag it in the review
  record instead of silently deleting it.
- Prefer the source occurrence with the most useful literal title and description;
  use attribution completeness and then source order to break ties. Do not
  mechanically choose the first occurrence if it loses useful context. Keep the
  retained occurrence in the newsletter whose source text was selected.
- Keep every source URL, newsletter occurrence and original description in the
  retained item’s reference record so requested source comparisons remain possible.

Recalculate each queue’s positions, total and sweep after removal. Empty editions
produce a valid empty pair (`items: []`, `sweep_playback: ""`) and are identified
in the generation result. Voice reports no items and does not invent playback.
Late editions must not silently replace files already used in a commute; report
which edition is new and create an explicitly identified revision if regeneration
is requested. Existing files remain identifiable for their session exports.

Acceptance: inspect several days with exact duplicates, the same story at
different URLs, useful updates, similar-but-distinct stories and no duplicates.
For every removed occurrence, show the retained article and the reason. Review
what disappeared, not just what Voice reads. Brad can correct those decisions
before deployment. No ongoing cross-chat “seen” database is required; removal
happens during generation.

### R4 — Give unclear headlines useful context

For a headline-only item whose title is an unexplained product name or otherwise
does not say what it is about, append a short, exact excerpt from its newsletter
description to `item_playback`. A self-contained title keeps the short existing
playback. Keep the original title and full description in the reference.

Use the shortest complete opening sentence or sentences that explain the item.
Do not manufacture an explanation from the name or cut a sentence to satisfy an
arbitrary word limit. Flag unusually long excerpts for Brad’s sample review.
Do not change the interest or depth classification merely to get more context read.
The opening sweep remains titles and modes only. In-depth playback retains the
full original description. Any duplicate/update wording is prepared at generation.

Acceptance: Brad reviews before/after examples including unclear product names,
clickbait and already-clear headlines from several editions. During simulation,
he judges usefulness and whether the extra reading is worthwhile. Correct the
selection/excerpt instructions from that feedback; no separate large experiment
is required.

### R5 — Improve classification with a small blind review and final check

Revise the profile, instructions and examples using existing labels and verified
feedback. This is calibration of an LLM-based classifier, not model-weight
training or reinforcement learning. Use the current Project as the producer for
both baseline and candidate runs.

Use three kinds of evidence:

| Evidence                   | How to use it                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Development                | Historical newsletters across dates and editions, existing answers, and verified corrections used to revise the classifier                 |
| Tests of reported problems | Exact omission, scoring and presentation examples used to check that those problems do not recur; report separately from ordinary accuracy |
| Final check                | Previously unused articles reserved before tuning; compare current and candidate predictions against Brad’s blind answers                  |

Reuse Brad’s answers where they provide the needed interest and depth labels.
Ask only for missing labels needed for a useful comparison. Present the title,
original description, URL and verified attribution without predictions or
rationales. Collect interest and depth independently; allow “unsure.” Keep all
copies of the same article or closely related story in one group when assigning
data. Do not treat a prior model prediction as Brad’s answer.

Start with a small batch spanning multiple dates and editions; the runbook sets
an initial review size. Inspect results before asking for another batch. Include
articles excluded from past queues, ordinary articles and recorded errors. Do
not measure only the items Brad heard or only examples that produced complaints.
No particular historical date is a prerequisite. Use future newsletters for the
final check if the recoverable history has already been used to revise the rules.

Preference updates must include the recorded author and topic instructions:
Martin Fowler defaults to high interest and in-depth discussion; Addy Osmani has
an explicit strong author preference without an invented blanket depth correction;
robotics and self-driving interest includes Tesla and Waymo. Include the exact
practical-agent, software-craft and negative-topic corrections described in the
[commute findings](commute-log-review.md). A direct preference is an input to the
revision, not a reason for a separate research program.

For each selected newsletter, account for every editorial article as included,
excluded with a reason, or failed at a named step. This small private review
record also shows duplicate decisions, versions used and attribution failures.
Use source-confirmed articles rather than reconstructing missing emails from
incomplete queues. Repeated exports and copies of a conversation count once.
Preserve exact corrections even when the old queue’s routing version is unknown;
do not rewrite its history or invent corrected numeric scores.

Acceptance: show changed classifications, false skips, missed depth and unwanted
in-depth items against Brad’s answers, with counts and missing labels stated.
Brad decides whether the candidate is no worse and useful enough to deploy.
Fix serious misses before release. If final-check answers are used to revise the
classifier, obtain a small fresh check rather than presenting a rerun as unseen
evidence. Continuing to collect feedback after deployment does not impose a
four-week waiting period on this release.

## Part 2 — Existing behavior to preserve

### R6 — Run unattended in the ChatGPT Project and remain usable from the phone

The weekday 11 a.m. America/New_York ChatGPT task must perform the complete
newsletter retrieval, classification and generation process and place actual
output files directly in the `LLM-Wiki-Car` Project Library. Brad is at work and
this Mac is unavailable. New features must run through the existing task prompt,
Project instructions, supporting files and the tools used in that environment.

Use source-email delivery dates for filenames, including catch-up requests.
Identify missing editions and failed files in the generation result. A task
status or promised filename does not establish that a usable download exists.

The established recovery for a failed final write is a manual prompt in a new
chat in the same Project on the phone. Preserve it. Do not build a local queue
producer, provider integration, scheduler, upload service or Mac fallback for
this upgrade. Repository checks and temporary review tools serve development;
they are not part of the unattended daily process.

Monday, September 7 is a holiday. New newsletters arrive Monday, but Brad’s first
listen is Tuesday morning, September 8. The target is to finish all five
improvements during the long weekend, generate Monday’s files and have them
ready for Tuesday. Keep the currently usable generation instructions available
if a candidate needs more work.

### R7 — Preserve source accuracy and separate classification from presentation

Keep separate interest and depth scores and the existing thresholds unless a
specific reviewed scoring change requires otherwise. Derive routes from those
scores; the classifier must not invent routes or decide wiki saves. Validate
scores, labels, IDs and missing/duplicate outputs before producing files.

Find all editorial items in direct TLDR General, Dev, AI and Fintech deliveries;
exclude advertisements and newsletter wrapper material. Preserve exact source
IDs, original titles/descriptions and resolved URLs. A parsing or tool failure
is not an uninterested classification. Do not impose an arbitrary queue size.
Keep the current one-queue-per-Voice-session model, reading order and ordinary
navigation, except for the explicit duplicate and context changes above.

### R8 — Preserve feedback, exports, privacy and human review

Saves and corrections remain tied to the exact article. Skip, already heard,
already wikied, general discussion and playback errors are not automatic scoring
labels. Preserve retractions and feedback about an explicitly identified previous
item. A wiki change still requires Brad’s explicit save.

The final session bundle remains sufficient for local intake, including the
complete queue data and supported saves/corrections. Do not redesign export
retries or unrelated commute processing. Keep old queues and bundles readable.

Keep raw Gmail bodies, credentials and private work material out of Git. Store
private article extracts, answers and review results under `.private/`; commit
only suitable invented test cases and concise findings without private details.

Brad reviews and approves PRs and live changes. Preparing later stacked PRs does
not wait for earlier merges. Each live change names the exact Project files or
instructions Brad must replace; record completion only after installation is
confirmed. Restoring a prior version uses those same version-controlled files
and the established manual replacement procedure.
