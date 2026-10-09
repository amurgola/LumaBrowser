# Dom

`core/llm-server/ui/js/dom/Dom.js`

The one element factory and id lookup for renderer code.

## Methods

- `Dom.el(tag, cls?, html?)` creates an element. `cls` is applied only when
  truthy. `html` is assigned whenever it is not `null`/`undefined`, so `''`
  clears and `0` renders `0`, while omitting it leaves the node empty. `html` is
  raw HTML: escape interpolated values with HtmlEscaper first.
- `Dom.byId(id)` is `document.getElementById(id)`.

## Why `el`, never `$`

Legacy pages had a top-level `$ = getElementById` in shared.js and four IIFEs
that shadowed `$` with a three-argument factory, so `$` meant two things on one
page; calling the lookup with factory arguments silently returned `null`.

## Globals

Reads `document`.
