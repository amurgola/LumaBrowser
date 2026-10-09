# ToolBundleCodec

`extensions/tool-forge/ToolBundleCodec.js`

Tool export and import as a JSON bundle of the portable definition only.

## Methods

- `new ToolBundleCodec({ store, names })`.
- `exportBundle(name)`: `{ format: 'luma-tool', version: 1, exportedAt, tool:
  { name, label, description, inputSchema, configSlots, allowedHosts, code } }`.
  Config VALUES are never included. `No tool named "<name>".` when unknown.
- `importBundle(bundle)`: throws `Not a Luma tool export file.` unless
  `format === 'luma-tool'` with a `tool` object. Coerces the name
  (`toolNameFrom`), takes a free one ([ToolNames](ToolNames.md)`#freeName`),
  saves a draft with `lastTest: null`, and returns `{ tool, warnings }`
  (a rename warning when the name changed, always the "Imported as a draft:
  test it ..." reminder). Never registers anything.
- `ToolBundleCodec.toolNameFrom(raw)`: a valid name as-is, else lowercased,
  non `[a-z0-9_]` runs -> `_`, leading non-letters dropped, 41 chars, falling
  back to `imported_tool`.
- Statics `FORMAT`, `VERSION`, `FALLBACK_NAME`.
