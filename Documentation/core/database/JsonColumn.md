# JsonColumn

`core/database/JsonColumn.js`

Parses JSON stored in a SQLite text column.

## Methods

- `JsonColumn.parse(text, fallback)` returns the parsed value, or `fallback`
  when the text is not valid JSON. A function fallback is called with the raw
  text. Omitting `fallback` throws.

## Why

The fallback is required and has no default. Two legacy stores pass
`(raw) => ({ _raw: raw })`, which preserves unparseable text for a caller to
inspect; that odd shape is load-bearing somewhere. Making the argument explicit
means nobody inherits the quirk by accident and nobody removes it without
deciding to.
