# ExtraTools

`core/llm-server/chat/bridge/tools/ExtraTools.js`

Normalises a chat mode's per-turn `extraTools`.

## Methods (all static)

- `normalize(extraTools)` returns `{ defs, handlers, sandboxed, roots,
  evictionHooks }`. Entries need a `name` and a function `handler`.
  `defs`: `{ name, description ('' default), inputSchema (empty object schema
  default), mutating (literal true only) }`. `handlers`: Map name -> handler.
  `sandboxed`: Set of names with literal `sandboxed: true` (exempt from the
  approval question). `roots`: Map name -> `projectRoot`. `evictionHooks`:
  Map name -> `onResultEvicted`.
