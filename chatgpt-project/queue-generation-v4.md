# TLDR Queue Generation Instructions — Playback/Reference Pair v4

Use these instructions with `tldr-commute-playback-v4.schema.json` and
`tldr-commute-reference-v4.schema.json`. Generate both UTF-8 JSON `.txt` files
for every source newsletter in one run. The date comes from the source email's
America/New_York delivery date.

For a main file such as `20260907-tldr-dev.txt`, create the sibling
`20260907-tldr-dev-reference.txt`. Never overwrite a pair already used by a
session. For an explicit rerun, add the same revision before `.txt` in both
names, for example `-v2-trial.txt` and `-v2-trial-reference.txt`.

## Attribution before classification

Resolve every tracking link to the original article URL before lookup or
classification. Reuse one attribution result for every occurrence of the same
resolved URL.

Use exact newsletter attribution when it is present. Otherwise open the
resolved article URL with the generation chat's browsing tools and inspect page
metadata plus the visible byline and publication/site name. Never infer an
author from a person mentioned in the title or article. If access fails, retry
once, then continue with other articles and editions.

Each reference item has nonempty `author` and `publication` strings plus:

- `attribution.resolved_url`: the same final URL stored in `url`;
- `author_source`: `newsletter`, `article_page`, `no_authors_listed`, or
  `lookup_failed`;
- `publication_source`: `newsletter`, `article_page`, or `hostname_fallback`;
- `lookup_attempts`: 0 when newsletter attribution was sufficient, otherwise
  the number of article-page attempts, at most 2.

Use the published names, including multiple authors or an organizational byline
when that is what the page lists. If the page is readable but has no byline, set
`author` to `No authors listed`. After two failed access attempts, set it to
`Author lookup failed`; never use that failure as evidence that the page has no
byline. If no publication name is available, use the resolved URL hostname
without leading `www.` and record `hostname_fallback`.

Pass verified author/publication data into classification. Pass `author: null`
with `attribution_status: no_authors_listed` or `lookup_failed` for the two
status values so they cannot become author-preference signals. A lookup failure
does not change interest or depth.

## Main playback file

The main object has exactly two keys in this order: `sweep_playback`, then
`items`. Each item has exactly one key, `item_playback`. It contains no IDs,
scores, URLs, descriptions, titles, versions, or other metadata.

Order all headline-only items before in-depth items. For item N of M, the sweep
line is `<N> of <M>. <Headline only|In depth>. <title>`. Join sweep lines with
newlines. A headline-only `item_playback` is that line. An in-depth
`item_playback` is that line, a newline, and the full literal newsletter
description. An empty queue is `{ "sweep_playback": "", "items": [] }`.

## Reference file

The reference contains the complete queue identity, source, classification,
routing, and export data required by its schema. `items` matches the main array
by position, and each `position` is its one-based array position. Preserve exact
source IDs, titles, descriptions, resolved HTTP(S) URLs, author/publication
values available under the current generation rules, scores, labels, signals,
reasons, timestamps, and producer versions. Do not include raw email bodies,
credentials, cookies, private notes, or Range material.

Set `main_filename` to the exact main filename. Set `main_sha256` by running the
following in the Project code tool after constructing `main`; do not ask the
model to write or estimate the digest:

```python
import hashlib, json

# The v4 main contains only strings, arrays, and objects, so these options emit
# the same UTF-8 JSON bytes as JSON.stringify(parsedMain), preserving key order.
canonical_main = json.dumps(main, ensure_ascii=False, separators=(",", ":"))
main_sha256 = "sha256:" + hashlib.sha256(canonical_main.encode("utf-8")).hexdigest()
```

## Required preflight in the Project code tool

Run this check against the final objects before writing either download:

```python
import hashlib, json

assert list(main) == ["sweep_playback", "items"], "main keys/order"
assert len(main["items"]) == len(reference["items"]) == reference["total_items"], "pair counts"
lines = []
for index, (played, item) in enumerate(zip(main["items"], reference["items"]), 1):
    assert item["position"] == index, f"reference position {index}"
    assert list(played) == ["item_playback"], f"main item {index} shape"
    mode = "Headline only" if item["consumption_depth"] == "headline_only" else "In depth"
    prefix = f'{index} of {reference["total_items"]}. {mode}. {item["title"]}'
    expected = prefix if item["consumption_depth"] == "headline_only" else prefix + "\n" + item["description"]
    assert played["item_playback"] == expected, f"item playback {index}"
    lines.append(prefix)
assert main["sweep_playback"] == "\n".join(lines), "sweep"
assert reference["main_filename"] == main_filename, "main filename"
canonical_main = json.dumps(main, ensure_ascii=False, separators=(",", ":"))
digest = "sha256:" + hashlib.sha256(canonical_main.encode("utf-8")).hexdigest()
assert reference["main_sha256"] == digest, "main hash"
```

Validate each object against its attached v4 schema. Create both real Project
Library files only after every pair passes. Report missing editions and failed
files explicitly; a promised name or Task status is not a created file.

## Reusable manual request

```text
Generate TLDR v4 commute queue pairs for emails delivered on [DATE OR DATE RANGE].
Use the Project's v4 generation instructions and both attached v4 schemas.
Create both real downloadable files for each newsletter. If a filename already
exists, use the requested revision suffix and do not overwrite it.
```
