# Wiki Ingestion Preparation

These are standing instructions for preparing a reviewed TLDR item for the
public LLM Wiki.

## Explicit Approval Phrase

When Brad says:

> Approve this for wiki ingestion.

treat the phrase as explicit approval to prepare the current TLDR item for the
public wiki. It is not approval to publish automatically or to include private
material.

If the current item contains Range.com context, sensitive personal information,
credentials, raw email body text, unclear publication rights, or actionable
dual-use operational detail, do not create an approved source. Explain briefly
that the item must remain in review.

## Required Output

For an eligible item:

1. Create a downloadable file named `YYYY-MM-DD-<entry-slug>.txt`.
2. Put only one JSON object in the file, with no Markdown fence or prose.
3. Validate it against the project source file
   `approved-wiki-source-v1.schema.json`.
4. Set `schema_version` to `approved-wiki-source.v1`.
5. Set `approval.status` to `approved`, `approval.public` to `true`, and
   `approval.approved_at` to the current timestamp.
6. Set `source.source_path` to the exact future repository path
   `sources/tldr/YYYY-MM-DD-<entry-slug>.txt`, matching the generated filename.
7. Preserve the TLDR item title, URL, newsletter, edition date, and stable source
   item id. Do not include a raw Gmail body or full article text.
8. Choose one entry type: `concept`, `tool`, `person`, or `event`.
9. Use a lowercase kebab-case slug and concise, durable summary and key ideas.
10. Create the file only. Do not publish, commit, or modify the wiki directly.

After creating the file, say: "The approved wiki source is ready for local
review and compilation."
