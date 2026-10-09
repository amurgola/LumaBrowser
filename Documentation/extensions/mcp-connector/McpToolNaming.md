# McpToolNaming

`extensions/mcp-connector/McpToolNaming.js`

Namespaces discovered tools so they never collide with core, extension or each
other's tools.

## Methods (all static)

- `slugify(name)`: lowercase, runs of non `[a-z0-9]` -> `_`, trimmed of `_`;
  `server` when empty.
- `makeToolName(serverSlug, toolName, taken)`: `mcp__<slug>__<tool>` with
  characters outside `[a-zA-Z0-9_-]` replaced by `_`, cut to `MAX_TOOL_NAME`
  (60); a name already in `taken` gets `_2`, `_3`, ... (still within 60). The
  result is added to `taken`.
- `EXTENSION_ID` (`'mcp-connector'`), `MAX_TOOL_NAME` (60).
