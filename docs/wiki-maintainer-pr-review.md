# Wiki Maintainer PR Review

Use this checklist for the early manual reviews required by operating-loop task
4.4. It defines the expected 4.3 outcomes without creating an extra approval
gate: the maintainer still creates its branch and PR directly, and the PR diff
is the review point.

The accompanying fixtures are declarative review scenarios plus
result-recording checks. They do not simulate an LLM making the maintenance
decision or deterministically prove duplicate avoidance, provenance
preservation, or link usefulness. Task 4.4's review of real PR diffs is the
behavioral evidence for those judgments.

## Inaccessible URL

- Check that the maintainer tried distinct, targeted routes: the requested URL,
  an exact-title and author/publisher lookup, the author's or publisher's
  canonical page and its article link, and a credible alternate rendering when
  available. Repeating the same failed request is not a fallback.
- Confirm the private result records which routes worked, which failed, and
  which parts of the source were readable. Search snippets are discovery leads,
  not full-article evidence.
- Accept a useful partial update when each claim is supported and attributed to
  its actual basis: readable article text, an exact newsletter excerpt, or the
  item's captured commute discussion. Keep those evidence types distinct and
  state any remaining limitation in the page or result detail.
- Reject detailed claims inferred only from a queue headline. A queue summary or
  commute discussion can support a narrow, clearly attributed note, but it must
  not be presented as the article's own claims.
- Do not treat one failed URL as a reason for an automatic no-op. Use
  `insufficient_source` only when fallback attempts and captured evidence still
  cannot support a useful, accurate change; keep that candidate retryable and
  record the next useful route.

## Duplicate Source Concept

- Search existing wiki slugs, titles, tags, and related links before accepting a
  new page.
- If the existing page already covers the source without a useful addition,
  expect `no_change` naming that page.
- Reject a second page that merely rephrases an existing concept.

## Existing-Concept Update

- Prefer updating the existing page when the available evidence adds material
  information to that concept. Label partial or discussion-derived content so
  readers can see what it establishes.
- Preserve useful existing content, frontmatter, provenance, and prior source
  relationships.
- Require concise original synthesis and visible provenance for each evidence
  type; reject copied passages or claims that overstate a partial source.
- Confirm the result detail names the affected wiki path.

## Link-Only Change

- Accept a link-only diff when it materially improves navigation or explains a
  real relationship between existing concepts.
- Reject cosmetic reciprocal links, link churn, filler prose, and a new page
  created only to house a link.
- Confirm links use the repository’s Jekyll-compatible related-link patterns and
  resolve under the site validation gate.

## Every Early Maintainer PR

- Reject invented approval, public, reviewer, safety-review, or confirmation
  metadata. The exact `wiki_this` capture authorizes maintenance and the PR is
  the review point.
- Confirm the diff contains only evidence-grounded public wiki changes and
  identifies article text, an exact newsletter excerpt, or the item's captured
  commute discussion accurately. Omit raw email text, credentials, private
  work details, and unsafe rendered content.
- Confirm created and updated pages preserve valid Jekyll structure.
- Check that each `pr_created` candidate detail names its page or link effect
  and evidence basis, while no-change and unresolved candidates remain
  observable in the private result with useful retry context.
- Run the repository checks appropriate to the changed wiki content.
- Keep manual review in place; these fixtures do not define an auto-merge
  subset.
