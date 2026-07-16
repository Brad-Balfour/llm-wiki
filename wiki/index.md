---
layout: default
title: LLM Wiki
permalink: /wiki/
---

# LLM Wiki

This is the reviewed, public read path for durable knowledge compiled from
approved sources. Raw Gmail bodies, private work context, commute transcripts,
and unreviewed voice notes do not belong here.

## Entry Types

- [Concepts](concepts/)
- [Tools](tools/)
- [People](people/)
- [Events](events/)

## Recent Additions

{% assign recent_entries = site.pages | where_exp: "entry", "entry.type and entry.updated and entry.path != 'wiki/ENTRY_TEMPLATE.md'" | sort: "updated" | reverse %}
{% for entry in recent_entries limit: 10 %}

- [{{ entry.title }}]({{ entry.url | relative_url }}) — {{ entry.type | capitalize }}, updated {{ entry.updated | date: "%B %-d, %Y" }}
  {% endfor %}
