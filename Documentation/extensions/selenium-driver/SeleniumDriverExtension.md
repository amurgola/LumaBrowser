# SeleniumDriverExtension

`extensions/selenium-driver/SeleniumDriverExtension.js`

The selenium-driver lifecycle. It owns at most one [WebDriverServer](WebDriverServer.md),
the saved settings ([SeleniumDriverSettings](SeleniumDriverSettings.md)) and the LLM
selector fallback service ([LlmSelectorFallback](LlmSelectorFallback.md)). Selenium
clients connect with `RemoteWebDriver('http://127.0.0.1:9515' + prefix)`.

## Methods

- `activate(context)` reads settings from `context.db.getRawDb()`, builds the fallback
  service, registers the IPC handlers, binds `mcp-tools.js`, autostarts when
  `selenium.enabled` is true (a failed autostart is only warned), and resolves the API
  `{ start, stop, status, getSettings, setSettings }`.
- `deactivate()` stops the server (errors swallowed) and drops all state.
- `start()` -> `{ success: true, port, host, prefix }`, `{ success: true, already: true, port }`,
  or `{ success: false, error }` (never throws). A fresh server is built per start.
- `stop()` -> `{ success: true }` or `{ success: true, already: true }`.
- `status()` -> `{ running, port, host, prefix, sessions, settings }`.
- `getSettings()`, `setSettings(patch)`.

## Entry files

- `manifest.js`: id `selenium-driver`, load priority 80; requires `core:browser`,
  `core:database`; optional `core:llm-service` (slot `fallback`); settings tab
  `selenium-driver`; `routes` at `/api/selenium`; `mcpTools`;
  `renderer.js` (module entry setting `window.__ext_selenium_driver` over
  [ui/SeleniumSettingsTab](ui/SeleniumSettingsTab.md)).
- `main.js`: `{ activate, deactivate }` delegating to one SeleniumDriverExtension.
- `mcp-tools.js`: `{ tools, handler, _bind(api) }` ([SeleniumMcpToolSet](SeleniumMcpToolSet.md)).
- `routes.js`: `createRoutes(context)` over `context.extensionApi` (503
  `selenium-driver not activated` without it): `GET /status`, `POST /start`,
  `POST /stop` (500 when `success` is false), `GET /settings`, `POST /settings`.
  The WebDriver protocol runs on its own port.

## IPC (renderer contract)

`ext.selenium-driver.start`, `.stop`, `.status`, `.settings.get`, `.settings.set(patch)`.

## Security

The server binds to `selenium.host` (default `127.0.0.1`) with no authentication or
Origin check, exactly as legacy. It can run script and raw CDP commands in any
listed tab, including user tabs.
