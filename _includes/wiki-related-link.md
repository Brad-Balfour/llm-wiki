{%- assign related_entries = site.pages | where: "wiki_slug", include.slug -%}
{%- assign related_count = related_entries | size -%}
{%- if related_count == 1 -%}
{%- assign related_entry = related_entries | first -%}
[{{ related_entry.title }}]({{ related_entry.url | relative_url }})
{%- else -%}
{{ include.slug | escape }}
{%- endif -%}
