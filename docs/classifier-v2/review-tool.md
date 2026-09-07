# Classifier v2 blind-review tool

`scripts/classifier-v2-review.mjs` prepares private scoring inputs, a standalone
blind labeling page, and a baseline/candidate comparison. It makes no model calls
and does not generate commute files. Baseline and candidate predictions still
come from separate fresh chats in the existing ChatGPT Project.

Keep every input and output below `.private/`. Do not commit article extracts,
predictions, labels, or per-article comparison reports.

## One inventory

Use one JSON inventory for both assignments. Each distinct article appears once;
exact newsletter copies live in `source_occurrences`. Closely related articles
share `story_group_id`, and the tool rejects a group split between `development`
and `final_check`. Account for every editorial candidate with `disposition`:
`label`, `excluded`, or `failed`. Non-label dispositions require a reason.

```json
{
  "inventory_version": "classifier-v2-review.v1",
  "dataset_id": "classifier-v2-202609",
  "items": [
    {
      "article_id": "20260904-dev-01",
      "story_group_id": "agent-review-story",
      "assignment": "development",
      "review_bucket": "ordinary",
      "disposition": "label",
      "disposition_reason": null,
      "source_item_id": "dev-01",
      "newsletter": "TLDR Dev",
      "edition_date": "2026-09-04",
      "title": "Example title",
      "description": "The complete original newsletter description.",
      "url": "https://example.com/article",
      "author": "Example Author",
      "publication": "Example Publication",
      "attribution_status": "verified",
      "source_occurrences": [
        {
          "occurrence_id": "dev-01",
          "newsletter": "TLDR Dev",
          "edition_date": "2026-09-04",
          "source_item_id": "dev-01"
        }
      ]
    }
  ]
}
```

Use `reported_problem` only for a previously reported miss; ordinary historical
articles remain `ordinary`. An unreadable article can remain in the inventory as
`failed` with the failed step named in `disposition_reason`.

## Prepare fixed prediction input

Create the same prediction-only input for the current and candidate runs:

```sh
npm run review:classifier-v2 -- prediction-input \
  --inventory .private/classifier-v2/inventory.json \
  --assignment development \
  --out .private/classifier-v2/development-prediction-input.json
```

In two separate fresh Project chats, explicitly attach that file and the exact
profile/instructions being scored. Save results before collecting final-check
answers. A prediction file has this shape:

```json
{
  "dataset_id": "classifier-v2-202609",
  "assignment": "development",
  "profile_version": "2.1",
  "prompt_version": "classifier-instructions.v2",
  "items": [
    {
      "classifier_item_id": "20260904-dev-01",
      "interest_level": "interested",
      "interest_score": 0.9,
      "consumption_depth": "in_depth",
      "depth_score": 0.75
    }
  ]
}
```

For the baseline chat, attach the prediction input plus the installed profile
1.4 and classifier instructions v1, then send:

> Classify every attached prediction-input item using only the attached profile
> 1.4 and classifier instructions v1. Return one JSON object in the documented
> prediction-file shape. Set dataset_id and assignment exactly from the input,
> profile_version to 1.4, and prompt_version to classifier-instructions.v1. Do
> not generate commute files or use any label file or prior discussion.

For the candidate chat, attach the same prediction input plus profile 2.1 and
classifier instructions v2, then send:

> Classify every attached prediction-input item using only the attached profile
> 2.1 and classifier instructions v2. Return one JSON object in the documented
> prediction-file shape. Set dataset_id and assignment exactly from the input,
> profile_version to 2.1, and prompt_version to classifier-instructions.v2. Do
> not generate commute files or use any label file or prior discussion.

Save the JSON responses as separate private baseline and candidate files before
opening the labeling page. A Project chat is the producer; this script is not a
local classifier.

The review tool never receives labels while preparing prediction input.

## Collect blind answers

Build the page from the inventory alone, then open it locally:

```sh
npm run review:classifier-v2 -- label-page \
  --inventory .private/classifier-v2/inventory.json \
  --assignment final_check \
  --out .private/classifier-v2/final-check-labeler.html
```

The page contains article evidence but no scores, predictions, or model reasons.
Choose interest and depth independently; use `unsure` when needed. **Download
answers JSON** produces the local label file. Do not place a prediction path in
the page or rename a model answer as Brad's label.

## Compare

```sh
npm run review:classifier-v2 -- compare \
  --inventory .private/classifier-v2/inventory.json \
  --assignment final_check \
  --labels .private/classifier-v2/final-check-labels.json \
  --baseline .private/classifier-v2/final-check-baseline.json \
  --candidate .private/classifier-v2/final-check-candidate.json \
  --out .private/classifier-v2/final-check-comparison.md
```

The report counts distinct articles rather than newsletter copies; states missing
labels and predictions; separates ordinary and reported-problem examples; and
reports false skips, missed depth, unwanted in-depth items, lower-harm interest
disagreements, score distance, exclusions, failures, and changed classifications.
It does not declare the candidate accepted. If final-check answers cause a rule
change, move those items into development evidence and reserve fresh material
before making another blind-result claim.

Historical comparison results and the combined phone commute remain pending until
the candidate files are installed with Brad's approval and the private runs occur.
