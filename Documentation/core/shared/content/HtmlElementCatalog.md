# HtmlElementCatalog

`core/shared/content/HtmlElementCatalog.js`

The element categories the conversion relies on.

## Methods (static)

- `isVoid(name)`, `isRawText(name)`: parsing categories (`VOID`, `RAW_TEXT`).
- `isNonContent(name)`: in `METADATA` (head, title, script, style, template,
  noscript, meta, link, base), `EMBEDDED` (svg, math, canvas, iframe, video,
  audio, object, embed, picture, map) or `CONTROLS` (button, select, option,
  optgroup, datalist, input, textarea).
- `isChromeLandmark(name)`: `aside`, `footer`, `nav`.
- `isBlock(name)`: `BLOCKS` plus headings; these start and end a paragraph.
- `headingLevel(name)`: 1 to 6 for `h1` to `h6`, else 0.

## Why

Categories are grouped by why an element is dropped or shaped, so each
decision has one home:

- Metadata and embedded media never render as prose; their text is code,
  coordinates or fallback.
- Controls are dropped but `<form>` is not: some frameworks wrap a whole page
  in one form.
- Only `nav`, `aside` and `footer` are chrome by definition. `header` is not,
  because an article header holds its title; page headers are caught by role
  or link density in [BoilerplatePruner](BoilerplatePruner.md).
