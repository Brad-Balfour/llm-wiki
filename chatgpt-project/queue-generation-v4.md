# TLDR Queue Generation Instructions — Playback/Reference Pair v4

Use these instructions with `tldr-commute-playback-v4.schema.json` and
`tldr-commute-reference-v4.schema.json`. Retrieve all qualifying General, Dev,
AI, and Fintech editions for the requested delivery date before rendering any
file. Generate both UTF-8 JSON `.txt` files for every source newsletter in one
daily pass. The date comes from the source email's America/New_York delivery
date. Give every reference in the pass the same stable `daily_generation_id`.

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

## Repeated daily coverage and useful updates

Remove tracking parameters conservatively while resolving links. Preserve
different article paths and meaningful query parameters. Group identical final
URLs and classify each distinct URL once, reusing its attribution and result.
Keep every newsletter occurrence, original URL, literal title, and literal
description in `source_occurrences`; select the occurrence with the most useful
literal title and description. Use attribution completeness and then source
order only as tie breakers. The retained item's identity and source text must
exactly match `selected_source_occurrence_id`.

After classification, compare different URLs only when their titles and
descriptions appear to cover the same event or announcement. Sharing a topic or
company is not enough. Consult the sources when needed:

- remove coverage that adds no useful facts and record `removed_same_story`;
- keep material new information as `useful_update`, with the related retained
  item and a concise `update_note` prepared now for later playback;
- retain uncertain relationships as `uncertain` and flag them for review;
- leave unrelated articles as `original`.

Record every removal or kept relationship in `coverage_decisions`, including
the source occurrence, retained file/item, reason, and new information when an
update is kept. A fully removed edition still gets a valid empty pair whose
decisions point to the retained items in other files. Recalculate positions,
totals, hashes, and sweeps after all daily decisions.

In the generation result, include a private review table with one row per
removed, updated, or uncertain occurrence: source newsletter/item, outcome,
retained filename/item, reason, and new information. Also report editions with
no repeated coverage and empty editions. Do not put this table in queue files.

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
    attribution = item["attribution"]
    assert attribution["resolved_url"] == item["url"], f"resolved URL {index}"
    if attribution["author_source"] == "no_authors_listed":
        assert item["author"] == "No authors listed", f"absent byline {index}"
    elif attribution["author_source"] == "lookup_failed":
        assert item["author"] == "Author lookup failed", f"failed lookup {index}"
        assert attribution["lookup_attempts"] == 2, f"failed lookup attempts {index}"
    else:
        assert item["author"] not in ("No authors listed", "Author lookup failed"), f"verified author {index}"
    newsletter_sufficient = attribution["author_source"] == attribution["publication_source"] == "newsletter"
    assert (attribution["lookup_attempts"] == 0) == newsletter_sufficient, f"lookup attempts {index}"
    if attribution["publication_source"] == "hostname_fallback":
        from urllib.parse import urlparse
        expected_host = urlparse(item["url"]).hostname.removeprefix("www.")
        assert item["publication"] == expected_host, f"publication fallback {index}"
    lines.append(prefix)
assert main["sweep_playback"] == "\n".join(lines), "sweep"
assert reference["main_filename"] == main_filename, "main filename"
assert reference["daily_generation_id"] == daily_generation_id, "daily generation"
seen_occurrences = set()
for item in reference["items"]:
    assert item["source_occurrences"], "source occurrences"
    ids = [occurrence["occurrence_id"] for occurrence in item["source_occurrences"]]
    assert len(ids) == len(set(ids)), "occurrence ids"
    assert item["selected_source_occurrence_id"] in ids, "selected occurrence"
    selected = next(o for o in item["source_occurrences"] if o["occurrence_id"] == item["selected_source_occurrence_id"])
    assert [item[k] for k in ("source_item_id", "title", "description", "url")] == [selected[k] for k in ("source_item_id", "title", "description", "url")], "selected source text"
    seen_occurrences.update(ids)
canonical_main = json.dumps(main, ensure_ascii=False, separators=(",", ":"))
digest = "sha256:" + hashlib.sha256(canonical_main.encode("utf-8")).hexdigest()
assert reference["main_sha256"] == digest, "main hash"
```

After every pair passes, check the full daily set: each
`coverage_decisions[].retained_item` names an item in that day's files, its
`source_occurrence_id` is stored on exactly that retained item, all files share
one date and `daily_generation_id`, and no occurrence is retained by two items.

Validate each object against its attached v4 schema. Create both real Project
Library files only after every pair passes. Report missing editions and failed
files explicitly; a promised name or Task status is not a created file.

## Reusable manual request

```text
Generate TLDR v4 commute queue pairs for all qualifying editions delivered on [DATE OR DATE RANGE].
Use the Project's v4 generation instructions and both attached v4 schemas.
Create both real downloadable files for each newsletter. If a filename already
exists, use the requested revision suffix and do not overwrite it. Report the
complete article inventory and the private repeated-coverage review table.
```
