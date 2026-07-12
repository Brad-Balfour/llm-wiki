# Wiki Ingestion Test

This is the manual test path for compiling one reviewed TLDR item into the OKF
wiki.

## One-Time ChatGPT Project Setup

Add these project source files:

- `chatgpt-project/wiki-ingestion.md`
- `schema/approved-wiki-source-v1.schema.json`

## Prepare An Approved Source

In a project chat with the intended TLDR item selected, say:

> Approve this for wiki ingestion.

This phrase is explicit public-preparation approval. Do not use it for private,
Range.com-specific, sensitive, or unclear material.

Download the generated `YYYY-MM-DD-<entry-slug>.txt` file. Review its JSON, then
place it at the exact `source.source_path` declared inside the file, normally:

```text
sources/tldr/YYYY-MM-DD-<entry-slug>.txt
```

## Compile

From the implementation repository:

```bash
npm run compile:wiki -- \
  --input sources/tldr/YYYY-MM-DD-<entry-slug>.txt \
  --confirm-public
```

`--confirm-public` is the local human publication gate. Use it only after
checking privacy, publication rights, dual-use risk, URLs, and the proposed
public summary. The compiler fails closed without it.

The command prints one of:

- `created wiki/<type-directory>/<entry-slug>.md`
- `updated wiki/<type-directory>/<entry-slug>.md`
- `skipped wiki/<type-directory>/<entry-slug>.md`

Inspect the generated Markdown and `schema/compile-state.json` before committing
anything. Re-running the unchanged source should print `skipped` and should not
duplicate provenance.

After the branch is merged, the same compilation can be run manually from the
GitHub Actions workflow named **Compile approved wiki source**. Its
`source_path` input must name an approved record already committed under
`sources/tldr/`. The workflow opens a review PR containing the generated wiki
and compile-state changes; it also requires the `confirm_public` checkbox and
does not write directly to `main`. No scheduled compilation is enabled.

## Expected Review

Confirm that:

- the entry contains `type`, `title`, `created`, `updated`, `confidence`, and
  `provenance` frontmatter;
- the summary and key ideas contain only appropriate public material;
- the TLDR title and URL appear under Source Notes;
- the source path and stable source item id are correct;
- no prior provenance disappeared when an existing entry was updated.
