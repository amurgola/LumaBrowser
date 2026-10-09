# McpConnectorExtension

`extensions/mcp-connector/McpConnectorExtension.js`

Activation wiring of the MCP Connector extension. `main.js` is a thin entry
exporting `{ activate, deactivate }` that delegate to one instance.

## Methods

- `activate(context)`: builds an [McpServerStore](McpServerStore.md) on
  `context.db.getRawDb()`, an [McpClientManager](McpClientManager.md) and an
  [McpServerService](McpServerService.md); registers
  [McpSetupActions](McpSetupActions.md) with `context.setupTab.onInvoke`;
  starts `manager.reconnectAll()` in the background (a failure is logged
  `reconnectAll failed: <message>`, activation never waits). Returns the API
  `routes.js` reads as `context.extensionApi`:
  `{ getStore(), getManager(), getService(), status() }` (`status()` = service rows).
- `deactivate()`: `manager.disconnectAll()`, then drops the manager and service
  so the Setup tab answers `MCP Connector not ready`.

## Entry files

- `manifest.js`: same id, fields and text as legacy (a comment em-dash became a colon). The renderer phase added the `ui/` modules to the `assets` lists, because the `/llm-ui/ext/` asset gate serves only declared files and the module entries import them.
- `main.js`: `{ activate, deactivate }`.
- `routes.js` (controller, `/api/ext/mcp-connector`): `GET /servers`,
  `POST /servers` (201), `PUT /servers/:id`, `POST /servers/:id/reconnect`
  (404 `Server not found`), `DELETE /servers/:id`; same status codes and
  bodies as legacy, now through `extensionApi.getService()`.
- `setup-ui.js`, `setup-ui.css`: see [setup-ui](setup-ui.md). The tab calls
  `api.invoke(action, payload)` with the actions in McpSetupActions.
