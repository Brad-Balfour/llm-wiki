# TLDR Classifier Instructions

Version: `classifier-instructions.v1`
Profile version: `1.4`
Scope: Source-neutral classification of parsed TLDR editorial items.

The classifier emits only interest and depth facts about the item. It must not
emit commute behavior, routes, wiki destinations, stream-log placement, review
queue placement, discard decisions, or other downstream behavior.

## Input

The classifier receives sanitized item metadata only:

- `source_item_id`
- `newsletter`
- `edition_date`
- `section` when available
- `title`
- `summary`
- `url`

Do not rely on raw Gmail bodies, subject-only identification, forwarding wrapper
text, ads, subscription text, private notes, or credentials.

## Required Output

The canonical classification record is one JSON object with exactly these
fields:

```json
{
  "interest_level": "interested",
  "interest_score": 0.0,
  "consumption_depth": "headline_only",
  "depth_score": 0.0,
  "signals": ["example_signal"],
  "reason": "One concise source-neutral reason."
}
```

Allowed values:

- `interest_level`: `interested`, `maybe`, or `uninterested`.
- `interest_score`: number from `0.0` through `1.0`.
- `consumption_depth`: `headline_only` or `in_depth`.
- `depth_score`: number from `0.0` through `1.0`.
- `signals`: non-empty array of short source-neutral strings.
- `reason`: non-empty concise string explaining the classification.

Recommended score bands:

| Field | Label | Score band |
| --- | --- | --- |
| `interest_level` | `interested` | `0.80`-`1.00` |
| `interest_level` | `maybe` | `0.60`-`0.79` |
| `interest_level` | `uninterested` | `0.00`-`0.59` |
| `consumption_depth` | `in_depth` | `0.60`-`1.00` |
| `consumption_depth` | `headline_only` | `0.00`-`0.59` |

`interest_score` and `depth_score` are the primary calibration values. The enum
fields are stable routing labels derived from those scores so downstream code can
avoid duplicating threshold logic.

## Batch Output

The record shape above is per item. The runtime may classify one item per model
call or classify a small batch in one call.

For a batch, return an array of classification records in the same order as the
input items:

```json
[
  {
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
and each record validates independently. Application code attaches
`source_item_id` from the corresponding input item; the model output still emits
classification only.

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

1. Read the title and summary against `schema/interest-profile.md`.
2. Assign `interest_score` from `0.0` to `1.0`.
3. Set `interest_level` from the configured interest score band.
4. Assign `depth_score` independently from `0.0` to `1.0`.
5. Set `consumption_depth` from the configured depth score band.
6. Emit short `signals` that name the strongest profile/depth cues.
7. Emit a concise `reason` that explains the source-neutral judgment.

## Headline-Only Signals

Prefer `headline_only` when:

- The item is useful awareness, but the TLDR summary likely contains the entire
  actionable value.
- It is company/product/news-cycle information without a likely deeper lesson.
- It is a shallow launch, availability change, acquisition, funding round,
  personnel move, pricing change, product rumor, policy update, benchmark
  headline, device reveal, or market blurb.
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
  context management, or workflow changes.
- Product/design judgment, taste, usability, experimentation, or technical
  communication with transferable lessons.
- AI strategy, token economics, routing, moats, pricing, governance, or business
  model analysis with a real argument.
- Range-relevant trust, verification, data quality, compliance, correctness, or
  high-stakes automation patterns.
- Frontend, web, or software architecture guidance Brad may apply.
- Computing-culture, software-history, or career essays with reusable framing.
- Major physical-AI, fusion, bioscience, or fundamental-science capability
  changes where the details matter.

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
- Enum value is outside the allowed set.
- Score is missing, non-numeric, `NaN`, infinite, below `0.0`, or above `1.0`.
- `signals` is missing, empty, not an array, or contains non-string/empty values.
- `reason` is missing, empty, not a string, or contains raw private content.
- Any forbidden downstream field is present.
- The result is not one classification object for a single-item call or an array
  of classification objects for a batch call.
- Batch output length or ordering cannot be reconciled to the input items.

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

1. Generate predictions and save them to a fixed file before Brad labels items.
2. Do not expose predictions during label collection.
3. Collect labels independently for interest and depth.
4. Preserve cross-edition duplicate instances.
5. Compare interest and depth separately.
6. Categorize product harm as false skips, false discusses, pacing errors, and
   lower-harm label disagreements.
7. Treat false skips as the highest-priority product harm.
8. Keep July 3, 2026 and later direct TLDR emails as the next clean holdout
   unless Brad explicitly changes the validation plan.

Do not patch the canonical interest profile from a single weak or noisy
disagreement. Use repeated, high-harm, or clearly explanatory correction patterns.
