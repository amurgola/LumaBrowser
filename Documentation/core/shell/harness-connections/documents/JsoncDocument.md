# JsoncDocument

`core/shell/harness-connections/documents/JsoncDocument.js`

A JSON or JSONC config file (Claude Code, OpenCode, Cline). A
[ConfigDocument](ConfigDocument.md) with `ID 'jsonc'`, `LABEL 'JSON'`, `EMPTY '{}\n'`.

## Behaviour

- Parsed with jsonc-parser's `parseTree` (comments and trailing commas allowed).
- A syntax error throws `JSON syntax error on line <n>: <code>.`; a top level that
  is not an object throws `Expected a JSON object at the top level of the file.`
- Edits are delegated to [JsoncSplicer](JsoncSplicer.md).

## Why

jsonc-parser is already a dependency and gives node offsets; our own splicer
decides the text, so a round trip of add then remove returns the original bytes.
