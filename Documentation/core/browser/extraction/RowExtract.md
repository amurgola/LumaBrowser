# RowExtract

`core/browser/extraction/RowExtract.js`

In-page source that reads one repeating element (search result, product card,
table row) into a `{ field: value }` object. A field is the matched element's
text, or one of its attributes when the child selector ends in `@name`
(`a.title@href`). Shared by `extract_data` and `collect_list`. These are source
strings: they run in the page, not in Node.

## Methods

- `RowExtract.TEXT_OF_SRC` declares `textOf(el)`: the element's trimmed
  `innerText`, except that text ending in `...` or `…` yields to a longer
  `title` attribute. A form control reads as what it holds: a `<select>` as its
  chosen option's label (not every option), an `<input>` or `<textarea>` with no
  text as its trimmed `value`.
- `RowExtract.FIELD_SPEC_SRC` declares `fieldSpec(spec)`, which splits a child
  selector into `{ selector, attr }` (`attr` is `null` without a trailing
  `@name`; an `@` inside an attribute selector such as `a[href*="@shop"]` stays
  part of the selector), and `attrOf(el, attr)`: `href`, `src` and `value` come
  from the live property (an absolute URL, what the field holds now), anything
  else from `getAttribute`.
- `RowExtract.EXTRACT_ROW_SRC` is `TEXT_OF_SRC` plus `FIELD_SPEC_SRC` plus
  `extractRow(row, childMap)`, returning `{ item, els, attrs }`: per field, the
  text or attribute of `row.querySelector(selector)` (or `null`), the matched
  element, and the attribute name read (`null` for text). `@name` alone, with no
  selector, reads the attribute off the row itself. extract_data uses `els` and
  `attrs` to spot fields that read the same thing.

## Why

Sites often truncate cell text server-side ("noticea...") while the full value
sits in the title attribute. Both tools used to carry their own copy of this
rule and were one edit from drifting apart, so it lives here once.

A field whose selector matches nothing reads `null`; a malformed selector
throws, so the caller reports the syntax error instead of a silent column of
nulls.

Text alone cannot answer "where does this result link to" or "what does this
field hold": an icon link, an input and an image have no text of their own.
The `@attribute` form and the form-control rule cover those without a second
tool call per row.
