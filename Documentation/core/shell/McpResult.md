# McpResult

`core/shell/McpResult.js`

Builds the MCP tool-result envelope that every MCP tool handler returns.

## Methods

- `McpResult.text(data)` returns `{ content: [{ type: 'text', text }],
  structuredContent: data }`, where `text` is `data` as 2-space JSON.
- `McpResult.error(message)` returns `{ content: [{ type: 'text', text }],
  isError: true }`, where `text` is `{ success: false, error: message }` as
  2-space JSON. It deliberately has no `structuredContent`.

## Why

`structuredContent` lets MCP clients use the JSON directly instead of re-parsing
the text block (MCP spec 2025-06, SDK 1.13 and later). The text block is still
emitted for older clients, and both come from the same value so they always
agree.

A failure is not a typed result, so it carries no `structuredContent`; `isError`
tells the client to stop.

This is MCP protocol serialization, so it lives in `core/shell` beside
`McpAggregator`, not in `core/shared`. It replaced two drifted copies in the
legacy MCP tool modules (one of them lacked `structuredContent`).
