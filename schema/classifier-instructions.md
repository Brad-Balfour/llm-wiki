# TLDR Classifier Instructions

Version: `classifier-instructions.v2`
Profile version: `2.1`
Scope: Source-neutral classification of parsed TLDR editorial items.

The classifier emits only a source-neutral request reference plus interest and
depth facts about the item. It must not emit commute behavior, routes, wiki
destinations, stream-log placement, review queue placement, discard decisions,
or other downstream behavior.

## Input

The classifier receives sanitized item metadata only:

- `classifier_item_id`
- `source_item_id`
- `newsletter`
- `edition_date`
- `section` when available
- `title`
- `summary`
- `url`
- verified `author` when available, otherwise `null`
- verified `publication`
- `attribution_status`: `verified`, `no_authors_listed`, or `lookup_failed`

Use a verified author or publication as a preference signal when the interest
profile names it. `No authors listed`, `Author lookup failed`, and other lookup
status/error text are not authors and must not affect either score. A failed
lookup is not evidence that an article is uninteresting or shallow.

Do not rely on raw Gmail bodies, subject-only identification, forwarding wrapper
text, ads, subscription text, private notes, or credentials.

## Link Resolution

Before an item is written to a commute queue, its `url` MUST be the direct
article URL. If the newsletter supplies a TLDR tracking or redirect link, resolve
it first and save the final HTTP(S) destination instead. Do not emit a tracking
link as the item URL. If its destination cannot be resolved, flag the item for
review rather than inventing or guessing a destination URL.

## Required Output

The canonical classification record is one JSON object with exactly these
fields:

```json
{
  "classifier_item_id": "item-0001",
  "interest_level": "interested",
  "interest_score": 0.91,
  "consumption_depth": "headline_only",
  "depth_score": 0.28,
  "signals": ["example_signal"],
  "reason": "One concise source-neutral reason."
}
```

Allowed values:

- `classifier_item_id`: non-empty string exactly matching one input
  `classifier_item_id`.
- `interest_level`: `interested`, `maybe`, or `uninterested`.
- `interest_score`: number from `0.0` through `1.0`.
- `consumption_depth`: `headline_only` or `in_depth`.
- `depth_score`: number from `0.0` through `1.0`.
- `signals`: non-empty array of short source-neutral strings.
- `reason`: non-empty concise string explaining the classification.

Recommended score bands use gap-free numeric thresholds:

| Field               | Label           | Score threshold                 |
| ------------------- | --------------- | ------------------------------- |
| `interest_level`    | `interested`    | `score >= 0.80`                 |
| `interest_level`    | `maybe`         | `score >= 0.60 && score < 0.80` |
| `interest_level`    | `uninterested`  | `score < 0.60`                  |
| `consumption_depth` | `in_depth`      | `score >= 0.60`                 |
| `consumption_depth` | `headline_only` | `score < 0.60`                  |

`interest_score` and `depth_score` are the primary calibration values. The enum
fields are stable routing labels derived from those scores so downstream code can
avoid duplicating threshold logic.

## Batch Output

The record shape above is per item. The runtime may classify one item per model
call or classify a small batch in one call.

For a batch, return an array with one classification record for each input item:

```json
[
  {
    "classifier_item_id": "item-0001",
    "interest_level": "interested",
    "interest_score": 0.91,
    "consumption_depth": "headline_only",
    "depth_score": 0.28,
    "signals": ["closely_tracked_ai_company", "pricing_awareness"],
    "reason": "Primary-subject OpenAI pricing update; useful awareness but summary carries the value."
  }
]
```

Application validation must verify the array length matches the input item count
and each record validates independently. Every output record must include a
`classifier_item_id` that matches exactly one input item, with no missing,
duplicate, or unknown ids. Application code reconciles records by
`classifier_item_id`, then attaches `source_item_id` from the matched input item.
The model output remains source- and routing-neutral because
`classifier_item_id` is an opaque request reference only.

Batching is an optimization, not a schema change. Smaller batches are easier to
retry and quarantine. Larger batches reduce per-request overhead but increase the
blast radius of one malformed output and can dilute attention on borderline
items.

## Interest Axis

`interest_level` answers: does Brad want this surfaced?

- `interested`: likely worth surfacing.
- `maybe`: genuinely optional or marginal, worth surfacing only when time,
  review budget, or context allows.
- `uninterested`: not worth surfacing in normal TLDR consumption.

Do not use `maybe` to mean model uncertainty. First assign `interest_score` from
the profile evidence, then set `interest_level` from the score band. Use
`signals` and `reason` to explain the calibration.

## Depth Axis

`consumption_depth` answers: if surfaced, should the system spend deeper
attention on the linked item?

- `headline_only`: the title and TLDR summary likely capture the value.
- `in_depth`: the linked item likely contains useful reasoning, examples,
  implementation detail, frameworks, tradeoffs, methods, or actions beyond the
  TLDR summary.

Depth is independent from interest. For `uninterested` items, still assign the
best likely depth for auditability; routing code will normally ignore depth for
automatic surfacing.

## Classification Procedure

1. Read the title, summary, and verified attribution against
   `schema/interest-profile.md`.
2. Apply an explicit verified-author preference only when that person or
   organization is the article's byline. Do not infer it from a name in the
   title or summary.
3. Assign `interest_score` from `0.0` to `1.0`. A concrete strong positive can
   outweigh a broad negative lane; a generic mention of a favored topic cannot.
4. Set `interest_level` from the configured interest score band.
5. Assign `depth_score` independently from `0.0` to `1.0`, based on the likely
   value beyond the supplied summary. Do not copy the interest score.
6. Set `consumption_depth` from the configured depth score band.
7. Emit short `signals` that name the strongest profile/depth cues.
8. Emit a concise `reason` that explains the source-neutral judgment.

## Headline-Only Signals

Prefer `headline_only` when:

- The item is useful awareness, but the TLDR summary likely contains the entire
  actionable value.
- It is company/product/news-cycle information without a likely deeper lesson.
- It is a shallow launch, availability change, acquisition, funding round,
  personnel move, pricing change, product rumor, policy update, benchmark
  headline, device reveal, or market blurb.
- It is a routine model-release benchmark comparison without a reusable
  evaluation method or engineering lesson.
- It is corporate workforce or organization analysis whose useful value is the
  reported change and consequence, without a practical method Brad can apply.
- It is venture-capital or investing-industry commentary whose argument is
  already captured by the supplied summary.
- The likely reaction is "good to know" rather than "I want to inspect this."
- The item matches a known-awareness category such as Anthropic/OpenAI/Perplexity
  access, pricing, model availability, or policy changes, but the summary is
  enough.
- The item is major AI-science or frontier-capability news where Brad should stay
  aware, but the TLDR summary captures the useful update.

Never use `headline_only` as a synonym for `uninterested`.

## In-Depth Signals

Prefer `in_depth` when the linked item likely contains:

- Practical AI-assisted engineering techniques, agent loops, evals, QA, review,
  context management, documentation, plugin/harness design, or workflow changes.
- Product/design judgment, taste, usability, experimentation, or technical
  communication with transferable lessons.
- AI strategy, token economics, routing, moats, pricing, governance, or business
  model analysis with a real argument.
- Range-relevant trust, verification, data quality, compliance, correctness, or
  high-stakes automation patterns.
- Frontend, web, or software architecture guidance Brad may apply.
- Browser-native AI runtime implementation involving WebGPU, WebAssembly,
  workers, caching, integration APIs, or deployment tradeoffs.
- A concrete engineering incident report that explains a surprising measured
  fix and a reusable debugging or performance-diagnosis method.
- Computing-culture, software-history, or career essays with reusable framing.
- Software craftsmanship, progressive enhancement, migration, browser UI, or
  low-JavaScript architecture with a concrete argument or applicable method.
- Major physical-AI, fusion, bioscience, or fundamental-science capability
  changes where the details matter.

An unfamiliar tool name does not establish depth. Conversely, a short or generic
title does not make a practical article shallow when its description promises
methods, examples, tradeoffs, or deployment evidence.

## Forbidden Output Fields

Reject or quarantine any classifier output that includes downstream behavior,
including but not limited to:

- `voice_behavior`
- `route`
- `routing`
- `wiki_destination`
- `wiki_path`
- `commute_behavior`
- `stream_log`
- `review_queue`
- `discard`
- `source_destination`
- `full_fetch`

The application may persist derived behavior later, but the classifier must not
provide it.

## Fail-Closed Validation

Application validation must reject or quarantine a classifier record before
routing when any of these are true:

- Required field is missing.
- Extra field is present.
- `classifier_item_id` is missing, empty, duplicated in a batch, or absent from
  the input items for the classifier call.
- Enum value is outside the allowed set.
- Score is missing, non-numeric, `NaN`, infinite, below `0.0`, or above `1.0`.
- `signals` is missing, empty, not an array, or contains non-string/empty values.
- `reason` is missing, empty, not a string, or contains raw private content.
- Any forbidden downstream field is present.
- The result is not one classification object for a single-item call or an array
  of classification objects for a batch call.
- Batch output ids cannot be reconciled to the input items.

Rejected or quarantined outputs go to review with validation error metadata.
They must not be routed automatically to discard, stream log, commute queue, wiki
source output, or public wiki compilation.

Provider/model metadata is added by application code outside the model output:

- `profile_version`
- `prompt_version`
- `provider`
- `model`
- `classified_at`
- `raw_output_hash` when useful for audit

## Validation Methodology

For blind validation rounds:

1. Assign every source-confirmed article to `development` or `final_check` before
   tuning. Keep closely related stories in the same assignment.
2. Generate baseline and candidate predictions from the same prediction-only
   input and save each to a fixed private file before Brad labels final-check
   items. Prediction inputs never contain Brad's labels.
3. Generate the labeling page from the article inventory alone. Do not expose
   either prediction file, model reasons, or scores during label collection.
4. Collect labels independently for interest and depth and allow `unsure`.
5. Preserve every newsletter occurrence in the inventory, but count an exact
   duplicate article once in comparison metrics.
6. Compare interest and depth separately. Report missing labels and predictions
   rather than treating them as correct.
7. Categorize product harm as false skips, missed depth, unwanted in-depth items,
   and lower-harm disagreements. Treat false skips as highest priority and retain
   score distance from the configured thresholds.
8. Keep problem-focused examples separate from ordinary articles in the report.
   Final-check items become development evidence if their answers cause tuning;
   reserve fresh items before making another final claim.

Do not patch the canonical interest profile from a single weak or noisy
disagreement. Use repeated, high-harm, or clearly explanatory correction patterns.
