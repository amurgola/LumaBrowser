# FrontMatterParser

`tools/docs/FrontMatterParser.js`

Reads the leading `---` block of a markdown doc. Only `applies_to` (a block list of `- item` lines, an inline
`[a, b]` list or `[]`) and `scope` are interpreted; other keys are kept in `raw` and tolerated. A file that does
not start with `---` answers null. Present but malformed front matter throws a
[FrontMatterError](FrontMatterError.md): unclosed block, a line that is not `key: value`, `applies_to` not a list,
an invalid glob ([DocGlob](DocGlob.md)), or an empty `applies_to` without `scope: meta`. Quotes around values are
stripped; CRLF is accepted.

## Methods

- `static parse(text, file = '<doc>')` -> `{ applies_to, scope, raw }` or null.
- `static unquote(s)`.
