# BrowserMcpTools

`core/browser/BrowserMcpTools.js`

MCP controller for the `browser_*` tools (source `core.browser`). The definitions come from
[BrowserActions](BrowserActions.md); the handler validates each call, routes it to BrowserService and
shapes the reply with [McpResult](../shell/McpResult.md). The reply-building logic lives in
`core/browser/mcp/` and the shared fallback in `core/browser/controller/`.

## Members

- `BrowserMcpTools.TOOLS`: `BrowserActions.mcpToolDefinitions()`.
- `BrowserMcpTools.ROUTES`: tool name to private handler; equal to the TOOLS names (tested).
- `BrowserMcpTools.createDirectHandler(browserService, llmFallbackService, networkInterceptor)`
  returns the `(toolName, args)` function for the MCP aggregator.
- `new BrowserMcpTools(...same args)`; `handler()`; `handle(toolName, args)`. Unknown tools reply
  `Unknown core browser tool: <name>`; a throw replies its message.

## Routes

Every tab-scoped tool rejects a non-numeric `tabId` with `Invalid tab ID`. Success replies
`{ success: true, data }` where `data` is [McpPayload](mcp/McpPayload.md)`.data(result)` unless noted.

- `browser_get_tabs`: `getTabs({ includeSilent })`, data = the tab array.
- `browser_create_tab`: `createTab(url, { silent })`, then [SettledTab](mcp/SettledTab.md) (waits up to
  15 s, re-reads, ISO timestamps).
- `browser_navigate`: `navigate`, data passed through (`finalUrl` tells a redirect).
- `browser_close_tab` (`{ success: true }`), `browser_refresh`, `browser_execute_js`, `browser_get_source`
  (`type` default `clean`), `browser_get_console`, `browser_observe_page`, `browser_handle_dialog`.
- `browser_screenshot`: CSS-pixel image by default (`fullResolution: true` opts out), marks on request;
  reply from [ScreenshotReply](mcp/ScreenshotReply.md).
- `browser_click_at`, `browser_locate`: navigation stamped via [NavigationStamp](controller/NavigationStamp.md).
- `browser_get_network`: [NetworkLogQuery](controller/NetworkLogQuery.md).
- `browser_click`, `browser_type`, `browser_fill_form`, `browser_wait_for`, `browser_scroll`,
  `browser_get_table`, `browser_press_key`, `browser_get_element`: through
  [FallbackToolRunner](mcp/FallbackToolRunner.md). A `ref` satisfies the target on its own and an
  `llmFallback` never pre-empts it; fill has no top-level selector so it never falls back; scroll only
  falls back with a selector; wait_for and get_element need `selector` or `llmFallback` (`text` only
  narrows); click alone tries a vision click last.
- `browser_extract_data`: needs `baseSelector` and `childSelectors` (`EXTRACT_USAGE` otherwise), replies
  via [ExtractionReply](mcp/ExtractionReply.md). `browser_collect_list`: needs `itemSelector`
  (`baseSelector` accepted as an alias, `COLLECT_USAGE` otherwise), replies `{ itemSelector, ...data }`.
- `browser_select_option`, `browser_set_date`, `browser_set_slider`: validated (`option` / `date` /
  `value`, and `ref` or `selector`) before the page is touched, result passed through.
