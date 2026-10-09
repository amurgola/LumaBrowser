# ToolCompletions

`extensions/tool-forge/ui/ToolCompletions.js`

Tool-contract IntelliSense for the My Tools editor. It fires only after these
prefixes, so it never pollutes ordinary typing.

## Methods

- `ToolCompletions.register(monaco, tool)`: a javascript completion provider
  (trigger `.`); returns its disposable.
- `ToolCompletions.suggest(monaco, tool, lineBeforeCursor, range)`:
  `ctx.config.` -> the config slot keys ("config" or "config (secret)");
  `ctx.luma.` -> `fetchPage`/`openTab` snippets; `ctx.` -> `config`,
  `fetch` (snippet), `luma`; `args.` -> the input schema's properties with
  their type and description; otherwise `[]`.
- `ToolCompletions.argNames(inputSchema)`.
