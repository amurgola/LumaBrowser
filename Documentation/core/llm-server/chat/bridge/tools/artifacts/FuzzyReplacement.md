# FuzzyReplacement

`core/llm-server/chat/bridge/tools/artifacts/FuzzyReplacement.js`

Whitespace-tolerant fallback for an artifact edit whose `find` missed only by
indentation.

## Methods (all static)

- `apply(buf, find, replace, replaceAll)`: matches `find` as whole lines with
  leading/trailing whitespace ignored. Returns `{ ok: true, buf, count }`,
  `{ ok: false, code: 'notfound' }` or `{ ok: false, code: 'ambiguous', count }`
  (several windows without `replaceAll`). The replacement is rebased onto the
  file's real indentation, keeping nesting deeper than the find block's base;
  an empty `replace` deletes the lines.
