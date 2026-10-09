# RowExtract

`core/browser/extraction/RowExtract.js`

In-page source that reads one repeating element (search result, product card,
table row) into a `{ field: text }` object. Shared by `extract_data` and
`collect_list`. These are source strings: they run in the page, not in Node.

## Methods

- `RowExtract.TEXT_OF_SRC` declares `textOf(el)`: the element's trimmed
  `innerText`, except that text ending in `...` or `…` yields to a longer
  `title` attribute.
- `RowExtract.EXTRACT_ROW_SRC` is `TEXT_OF_SRC` plus `extractRow(row, childMap)`,
  returning `{ item, els }`: per field, the text of `row.querySelector(selector)`
  (or `null`) and the matched element (extract_data uses `els` to spot fields
  that hit the same node).

## Why

Sites often truncate cell text server-side ("noticea...") while the full value
sits in the title attribute. Both tools used to carry their own copy of this
rule and were one edit from drifting apart, so it lives here once.

A field whose selector matches nothing reads `null`; a malformed selector
throws, so the caller reports the syntax error instead of a silent column of
nulls.
