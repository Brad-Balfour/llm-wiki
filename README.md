# llm-wiki

Personal LLM knowledge base and TLDR ingestion pipeline.

This repository is the implementation repo. The planning contract is contained
inside this repo under OpenSpec.

## Current Status

Phase 0 is in progress:

- OpenSpec has been initialized for Codex, GitHub Copilot, and Claude Code.
- The first OpenSpec change is `bootstrap-llm-wiki-mvp`.
- The TypeScript/Node runtime skeleton is initialized with focused parser,
  classifier-validation, and routing tests.
- TLDR text-file ingestion is implemented for pasted/exported email bodies,
  including manual Gmail connector handoff via confirmed body text.
- A manual ChatGPT Project + Gmail connector + Library + Voice workflow has
  produced and played a real commute queue as a proof of concept.
- The review-safe OKF wiki scaffold, private commute-handoff importer, and
  approved-source wiki compiler now exist. Live repo-backed classification,
  deterministic queue generation, feedback-label promotion, the first real
  wiki compilation, and public Pages enablement are not complete yet.

## Development

Use Node 24 with npm 11. The runtime decision is recorded in `docs/runtime.md`,
`.nvmrc`, `.node-version`, and `package.json`.

Project tooling should borrow practical conventions from the local sibling repos
`../bradbalfour-dot-com` and `../bradbalfour-photography` where they fit this
Node/TLDR project. Avoid copying frontend-, Astro-, Playwright-, Cloudflare-, or
browser-specific configuration unless a later OpenSpec change introduces that
surface area.

Common checks:

```bash
npm run ci:install
npm run check
openspec validate bootstrap-llm-wiki-mvp --type change --strict
```

Public wiki commands also run `npm run verify:publish` after generating output;
that is the required local gate before a publication PR is pushed.

Run local TLDR ingestion after building:

```bash
npm run ingest:tldr -- --input path/to/tldr-body.txt --output /tmp/tldr-items.json --review-output /tmp/tldr-review.json
```

Use `--input - --source gmail-manual --source-message-id <gmail-message-id>`
when pasting or streaming a manually confirmed Gmail connector body. The command
writes sanitized item-level JSON and review records; it does not persist raw
email bodies.

Import a structured post-commute handoff downloaded from ChatGPT Library:

```bash
npm run import:commute-handoff -- --input path/to/YYYYMMDD-tldr-commute-handoff.txt
```

The normalized record is written under gitignored
`.private/commute-handoffs/`. See `docs/commute-voice-handoff.md` for the Monday
workflow and `docs/replan-2026-07-12.md` for the current implementation order.

Record one or more exact classifier corrections without changing the live
profile or classifier:

```bash
npm run record:classifier-feedback -- \
  --input path/to/labels.json \
  --queue path/to/the-exact-queue.txt
```

The input may be one JSON object, a JSON array, or JSONL. Records must identify
the exact queue filename, item ID, title, and URL; include the original scores
and labels; preserve verbatim user feedback; and use routes consistent with the
deterministic routing table. Repeat `--queue` when one input contains labels from
multiple queues. The recorder validates every queue and matches the label's
identity, original classifier output, and model metadata before appending the
queue fingerprint and label to the gitignored
`.private/classifier-feedback/labels.jsonl`. Playback defects, presentation
preferences, duplicate/prior-awareness signals, and assistant summaries are
rejected as classifier labels.

The recorder serializes writes with a sibling `.lock` file containing its PID
and start time. If it reports a stale or unreadable lock after a crash, first
confirm that no recorder is running, then remove only that named `.lock` file
and retry; the JSONL store itself remains append-only.

Compile one explicitly approved TLDR source into the OKF wiki:

```bash
npm run compile:wiki -- \
  --input sources/tldr/YYYY-MM-DD-<entry-slug>.txt \
  --confirm-public
```

See `docs/wiki-ingestion-test.md` for the ChatGPT Project preparation and review
flow.

## MVP Direction

The MVP is TLDR-only:

1. Discover daily TLDR emails through a manual Gmail connector workflow, with a
   text-file fallback.
2. Extract non-sponsor editorial items.
3. Classify each item with a source-neutral two-axis classifier.
4. Derive commute, wiki, stream-log, and review behavior in application code.
5. Generate a prepared commute queue.
6. Capture Brad's corrections as feedback labels.
7. Compile approved source material into OKF-style markdown wiki entries.
8. Publish the readable wiki through GitHub Pages first.

Cloudflare Workers, RSS, YouTube, custom realtime voice, and a review/admin UI
are deferred until the TLDR loop proves useful.

## Planning

Primary planning artifacts live under:

```text
openspec/changes/bootstrap-llm-wiki-mvp/
```

Use OpenSpec artifacts as the implementation contract. The parent exploration
archive that seeded this repo is intentionally not required to understand or
contribute to the implementation.
