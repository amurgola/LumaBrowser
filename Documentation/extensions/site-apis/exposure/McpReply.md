# McpReply

`extensions/site-apis/exposure/McpReply.js`

The MCP envelope every Site APIs tool answers (endpoint tools and the site_apis_* management tools).

## Methods

- `McpReply.ok(result)`: `{ content: [{ type: 'text', text: JSON }], structuredContent: result, isError: false }`.
- `McpReply.fault(result)`: the same text part with `isError: true` and no structuredContent (a failure is not a
  typed result). `result` is `{ success: false, fault?, advice?, error? }`.
- `McpReply.error(message)`: `fault({ success: false, error })`.

## Decisions

Kept inside the extension rather than requiring `extensions/tool-forge/McpEnvelope.js`: Site APIs must not depend on
another extension's files being installed, and core's `McpResult.error` only carries a message, not a fault object.
`McpResultUnwrapper` reads `isError` and the text part, so both shapes reach the chat agent as `{ success, ... }`.
