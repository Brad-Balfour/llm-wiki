{%- assign related_entry = site.pages | where: "wiki_slug", include.slug | first -%}
{%- if related_entry -%}
[{{ related_entry.title }}]({{ related_entry.url | relative_url }})
{%- else -%}
{{ include.slug }}
{%- endif -%}
