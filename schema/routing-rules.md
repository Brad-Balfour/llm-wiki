# TLDR Routing Rules

Version: `routing-rules.v1`
Input: validated source-neutral classifier output from
`schema/classifier-instructions.md`.

Routing belongs in application code. The classifier must not emit route,
commute, wiki, stream-log, review, or discard fields.

## Inputs

Routing code may use:

- Sanitized parsed item metadata.
- Validated classifier fields: `interest_level`, `interest_score`,
  `consumption_depth`, `depth_score`, `signals`, and `reason`.
- Application metadata: `profile_version`, `prompt_version`, `provider`, `model`,
  parser version, classifier version, and route version.
- Validation error metadata for failed parser or classifier records.

Routing code must not use raw Gmail bodies, credentials, private notes, or
classifier-provided downstream fields.

## Default Derivations

| Classification | Commute | Wiki | Stream log | Review | Discard |
| --- | --- | --- | --- | --- | --- |
| `uninterested` | `skip` | `discard` | `none` | `none` | `true` |
| `interested` + `headline_only` | `quick_read` | `stream_log_only` | `write` | `none` | `false` |
| `interested` + `in_depth` | `discuss` | `full_source_candidate` | `optional_summary` | `none` | `false` |
| `maybe` + `headline_only` | `optional_quick_read` | `stream_log_or_review` | `candidate_after_review` | `classification_boundary` | `false` |
| `maybe` + `in_depth` | `optional_discuss_or_teaser` | `review_required` | `none` | `classification_boundary` | `false` |
| parser failure | `none` | `none` | `none` | `parse_error` | `false` |
| classifier validation failure | `none` | `none` | `none` | `validation_error` | `false` |

When a route is unclear, choose review over discard, stream log, commute queue, or
wiki promotion.

## Commute Queue

The MVP commute queue includes surfaced `interested` and `maybe` items and
excludes `uninterested` items except as audit metadata.

Default queue priority:

1. `interested/headline_only`
2. `interested/in_depth`
3. `maybe/headline_only`
4. `maybe/in_depth`

Separate quick-read and discuss sections in rendered queue files:

- Quick-read section: `quick_read` and `optional_quick_read`.
- Discuss section: `discuss` and `optional_discuss_or_teaser`.

When commute time is short, defer or downgrade `maybe` items before `interested`
items. A `maybe/in_depth` item may be reduced to a headline plus a save/resurface
prompt.

Each queue item must carry source item id, title, summary, URL, interest and depth
labels/scores, derived commute behavior, reason, profile version, prompt version,
provider, model, and route version.

## Wiki And Source Routing

`interested/in_depth` creates a full-source candidate, not automatic public
publication. Wiki compilation still requires approved source records and public
promotion review.

`interested/headline_only` writes stream-log-only awareness by default. It should
not trigger full fetch or wiki entry creation unless Brad later promotes it.

`maybe/headline_only` may become stream-log-only after review or when the item is
clearly non-sensitive and daily budget allows. Default to review if the boundary,
sensitivity, or public value is unclear.

`maybe/in_depth` defaults to review before full fetch or wiki source creation.

Never compile private Range.com context, raw Gmail body text, credentials,
sensitive personal content, dual-use operational detail, or unclear publication
status into public wiki output automatically.

## Review Queue

Send items to review when:

- Parser boundaries are ambiguous.
- Classifier output fails validation.
- Classifier output includes forbidden downstream fields.
- The item is `maybe/in_depth`.
- `maybe/headline_only` has unclear value or sensitivity.
- Public promotion status is unclear.
- The item contains private Range.com context, sensitive notes, credentials, raw
  email text, or dual-use operational detail.
- Commute voice notes request wiki publication, external sending, reminders, or
  work-related routing.

Review records should preserve enough sanitized context for manual inspection and
include parser, classifier, and routing metadata.

## Discard

Only validated `uninterested` items derive `discard`.

Do not silently discard parser failures, invalid classifier records, route-like
model output, or ambiguous sponsor/editorial boundaries. Send those to review.

## Stream Log

The stream log is for lightweight awareness items that are worth retaining but do
not deserve full-source fetch or wiki compilation.

Default stream-log candidates:

- `interested/headline_only`
- reviewed `maybe/headline_only`

Stream-log entries must be sanitized item-level metadata only. Do not include raw
Gmail body text, wrapper text, subscription text, credentials, private notes, or
unreviewed sensitive content.

## Audit Metadata

Persist derived routing metadata for auditability:

- `route_version`: `routing-rules.v1`
- `profile_version`
- `prompt_version`
- `provider`
- `model`
- `parser_version`
- `classified_at`
- `routed_at`
- validation status and validation errors, when present

Derived behavior is application truth. Classifier-provided behavior is invalid
input, not a routing hint.
