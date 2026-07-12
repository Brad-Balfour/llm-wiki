---
layout: default
title: People
permalink: /wiki/people/
---

# People

Individuals and the durable ideas associated with their work.

{% assign entries = site.pages | where: "type", "person" | sort: "title" %}
{% for entry in entries %}

- [{{ entry.title }}]({{ entry.url | relative_url }})
  {% endfor %}
