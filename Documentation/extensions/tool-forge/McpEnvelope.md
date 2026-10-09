# McpEnvelope

`extensions/tool-forge/McpEnvelope.js`

Wraps a result object in the MCP envelope the aggregator and the chat bridge
expect.

## Methods

- `McpEnvelope.wrap(result, isError)`:
  `{ content: [{ type: 'text', text: JSON.stringify(result) }], isError: !!isError }`.
