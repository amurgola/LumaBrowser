# ListDirTool

`extensions/code-mode/tools/project/ListDirTool.js`

`list_dir { path? }` (a [CodeTool](../CodeTool.md)).

## Behaviour

One level of `context.code.listDir`, folders with a trailing `/`, `(empty)` for
none; a thrown listing is `{ success: false, error }`. Summary `<path or /> · N item(s)`.
