# SeleniumMcpToolSet

`extensions/selenium-driver/SeleniumMcpToolSet.js`

The lifecycle MCP tools `selenium_driver_status`, `selenium_driver_start`,
`selenium_driver_stop` (empty input schemas).

## Methods

- `SeleniumMcpToolSet.TOOLS`; `SeleniumMcpToolSet.handlerFor(api)` -> a handler that
  returns the API result as pretty JSON text; unknown tools throw
  `Unknown selenium-driver tool: <name>`.
