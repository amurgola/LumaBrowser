# CdpDriverExtension

`extensions/cdp-driver/CdpDriverExtension.js`

The cdp-driver lifecycle. It owns at most one [CdpServer](CdpServer.md), the saved
settings ([CdpDriverSettings](CdpDriverSettings.md)) and the LLM selector fallback
service ([LlmSelectorFallback](LlmSelectorFallback.md)).

Any CDP client attaches to the running server: `puppeteer.connect({ browserURL:
'http://127.0.0.1:9222' })`, `chromium.connectOverCDP('http://127.0.0.1:9222')`,
`CDP({ host, port })` (chrome-remote-interface), or Playwright MCP's `--cdp-endpoint`.

## Methods

- `activate(context)` reads settings from `context.db.getRawDb()`, builds the
  fallback service, registers the IPC handlers, binds `mcp-tools.js`, autostarts
  when `cdp.enabled` is true (a failed autostart is only warned), and resolves the
  API `{ start, stop, status, getSettings, setSettings }`.
- `deactivate()` stops the server (errors swallowed) and drops all state.
- `start()` -> `{ success: true, port, host }`, `{ success: true, already: true, port }`
  when running, or `{ success: false, error }` (never throws). A fresh CdpServer is
  built per start from the current settings.
- `stop()` -> `{ success: true }` or `{ success: true, already: true }`.
- `status()` -> `{ running, port, host, browserUuid, sessions, targets, settings }`.
- `getSettings()`, `setSettings(patch)` (writes then returns the fresh settings).

## Entry files

The loader and extension editor find these by name; each is thin.

- `manifest.js`: id `cdp-driver`, load priority 80; requires `core:browser` and
  `core:database`; optional `core:llm-service` (slot `fallback`); settings tab
  `cdp-driver`; `routes` at `/api/cdp`;
  `mcpTools`; `renderer.js` (module entry setting `window.__ext_cdp_driver` over
  [ui/CdpSettingsTab](ui/CdpSettingsTab.md)).
- `main.js`: `{ activate, deactivate }` delegating to one CdpDriverExtension.
- `mcp-tools.js`: `{ tools, handler, _bind(api) }`; `handler` is null until
  activation calls `_bind` ([CdpMcpToolSet](CdpMcpToolSet.md)).
- `routes.js`: `createRoutes(context)` over `context.extensionApi`, 503
  `{ success: false, error: 'cdp-driver not activated' }` without it. `GET /status`,
  `POST /start` and `POST /stop` (500 when `success` is false), `GET /settings`,
  `POST /settings`. These manage the server; the CDP protocol runs on its own port.

## IPC (renderer contract)

`ext.cdp-driver.start`, `.stop`, `.status`, `.settings.get`, `.settings.set(patch)`,
each returning the matching method's result.

## Security

The server binds to `cdp.host` (default `127.0.0.1`) and has no authentication or
Origin check, exactly as legacy. Changing the host to a LAN address exposes full
control of automation tabs.
