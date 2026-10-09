# McpPayload

`core/browser/mcp/McpPayload.js`

Turns tab manager results into the `data` of a browser MCP reply.

## Methods

- `McpPayload.data(result)`: `result.data` when present, minus an inner `success` flag on a plain object
  (in-page scripts report their own, always true by then); arrays pass through. Without `data`, the
  result's other fields except `success`, `error`, `urlChanged`, `newUrl`, or `{}`.
- `McpPayload.iso(ms)`: epoch ms to ISO 8601; non-numbers pass through, `undefined` becomes `null`.
