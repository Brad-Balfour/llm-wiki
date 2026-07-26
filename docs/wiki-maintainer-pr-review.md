# Wiki Maintainer PR Review

Use this checklist for the early manual reviews required by operating-loop task
4.4. It defines the expected 4.3 outcomes without creating an extra approval
gate: the maintainer still creates its branch and PR directly, and the PR diff
is the review point.

## Inaccessible URL

- Confirm the private maintenance result records the retrieval limitation and
  remains retryable.
- Reject detailed claims inferred only from a queue headline or summary.
- Confirm the inaccessible source alone did not produce a filler page or PR.

## Duplicate Source Concept

- Search existing wiki slugs, titles, tags, and related links before accepting a
  new page.
- If the existing page already covers the source without a useful addition,
  expect `no_change` naming that page.
- Reject a second page that merely rephrases an existing concept.

## Existing-Concept Update

- Prefer updating the existing page when the retrieved source adds material,
  source-grounded information to that concept.
- Preserve useful existing content, frontmatter, provenance, and prior source
  relationships.
- Require concise original synthesis and a visible relationship to the new
  source; reject copied passages or queue-summary substitution.
- Confirm the result detail names the affected wiki path.

## Link-Only Change

- Accept a link-only diff when it materially improves navigation or explains a
  real relationship between existing concepts.
- Reject cosmetic reciprocal links, link churn, filler prose, and a new page
  created only to house a link.
- Confirm links use the repository’s Jekyll-compatible related-link patterns and
  resolve under the site validation gate.

## Every Early Maintainer PR

- Confirm the diff contains only source-grounded public wiki changes and omits
  raw email text, credentials, private work details, and unsafe rendered
  content.
- Confirm created and updated pages preserve valid Jekyll structure.
- Check that each `pr_created` candidate detail names its page or link effect,
  while no-change and inaccessible candidates remain observable in the private
  result.
- Run the repository checks appropriate to the changed wiki content.
- Keep manual review in place; these fixtures do not define an auto-merge
  subset.
