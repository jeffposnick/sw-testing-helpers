---
layout: default
---

{% for docSection in site.data.docs %}
# {{docSection[1].name | capitalize}}

{% for page in docSection[1].pages %}
{% if docSection[1].name == 'releases' %}
{% assign pathParts = page | split: '/' %}
[View the docs for {{pathParts[2] }}]({{ page | prepend: site.github.url | replace: 'http://', 'https://' }})
{% else %}
[View the docs for {{docSection[1].name | capitalize}}]({{ page | prepend: site.github.url | replace: 'http://', 'https://' }})
{% endif %}
{% endfor %}
{% endfor %}
