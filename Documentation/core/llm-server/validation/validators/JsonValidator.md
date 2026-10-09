# JsonValidator

`core/llm-server/validation/validators/JsonValidator.js`

JSON and JSONC validator. Extends [ICodeLanguageValidator](../ICodeLanguageValidator.md).

## Members

- `name` is `'json'`; `languages` is `['json', 'jsonc']`.
- `validate(code, { language })` returns `[]` when the text parses, else one
  error diagnostic with `ruleId: 'json-parse'` and the parser's message. For
  `jsonc` the comments are stripped first with
  [JsonCommentStripper](JsonCommentStripper.md).
- `JsonValidator.locateError(message, text)` returns the 1-based
  `{ line, column }` of a V8 parse error: from `line L column C` when present,
  else by counting to `position N` in `text`, else `1:1`.

## Why

`JSON.parse` is the reference parser for what the app will later load, so
nothing more elaborate is needed. V8 has reported positions in both spellings
across versions, so both are read.
