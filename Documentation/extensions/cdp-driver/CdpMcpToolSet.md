# CdpMcpToolSet

`extensions/cdp-driver/CdpMcpToolSet.js`

The three lifecycle MCP tools: `cdp_driver_status`, `cdp_driver_start`,
`cdp_driver_stop`, all with an empty input schema.

## Methods

- `CdpMcpToolSet.TOOLS`: the tool definitions (names and descriptions unchanged).
- `CdpMcpToolSet.handlerFor(api)` -> `async (toolName) => { content: [{ type: 'text', text }] }`
  where `text` is the API result as pretty JSON; an unknown tool throws
  `Unknown cdp-driver tool: <name>`.
