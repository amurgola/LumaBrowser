# WorkTab

`core/llm-server/agent/WorkTab.js`

The agent's working browser tab.

## Methods

- `WorkTab.needsWorkTab(tool, params)`: true for tools in `ON_TAB_TOOLS`
  (every [BrowserTools](../../llm-service/BrowserTools.md) definition with a
  `tabId` param) unless the call names a real other tab. Default deny: web_search, MCP and extension tools
  never conjure a stray tab.
- `new WorkTab(browserService, { requestedTabId, lazy, onWorkTab })`; `id`,
  `created`, `lazy`, `promptTabId` (`LAZY_DEFAULT_TAB` -1 while lazy).
- `open()`: a requested tab is used as-is; otherwise, unless lazy, opens
  `about:blank` with `activate: false` (falls back to tab 0 on error).
- `ensure()`: lazy creation on first need, cached; a creation that reports no
  tab uses tab 0 without owning it.
- `closeIfOwned()`: closes a tab this run created.

`onWorkTab(id)` fires once, when the run first owns a tab; a throwing hook is ignored.
