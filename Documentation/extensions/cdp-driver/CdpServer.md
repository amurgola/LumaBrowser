# CdpServer

`extensions/cdp-driver/CdpServer.js`

The CDP endpoint: Chrome-style HTTP discovery ([CdpHttpBootstrap](CdpHttpBootstrap.md))
plus WebSocket upgrades, and the shared state the domains use.

WebSocket paths:

- `/devtools/browser/{browserUuid}`: browser-scoped (puppeteer.connect, connectOverCDP).
- `/devtools/page/{targetId}`: page-scoped; refused before the socket opens when the
  target is unknown. It gets an implicit session, so commands without a `sessionId`
  go to that page and its events carry no `sessionId`, as Chrome does.

Every upgrade is first checked by [LoopbackRequestGuard](../../core/shared/net/LoopbackRequestGuard.md) against the configured bind host
(`this.host`); a foreign `Host` or a cross-site `Origin` gets a raw 403 with
`{ error: <reason> }` before any handshake. Any other upgrade path is destroyed. Wire format (flat mode): in
`{ id, sessionId?, method, params }`, out `{ id, sessionId?, result | error }`, events
`{ sessionId?, method, params }` ([CdpFrameHandler](CdpFrameHandler.md)).

## Methods

- `new CdpServer({ browser, fallback, fallbackDefaults })` subscribes the
  [CdpTargetTracker](CdpTargetTracker.md) to the browser's tab events.
- `start(port, host = '127.0.0.1')` resolves the bound port.
- `stop()` terminates sockets, closes the listener, detaches every debugger, closes
  automation tabs, clears registries and unsubscribes from tab events.
- `isRunning()`, `port()` (null when stopped), `activeSessions()`, `activeTargets()`.
- `broadcast(frame)`: to every connection, but `Target.*` frames only reach
  connections that set discovery on.
- `attachSession(connection, target, flatten = true)`: attaches the debugger and
  registers a [CdpSession](CdpSession.md) whose `llmFallback` is
  `FallbackConfig.normalize(null, fallbackDefaults)`.
- `createAutomationTab(url, options)` -> the tab (throws on `{ success: false }`).
- `closeAutomationTabs()`, `closeTab(tabId)` (errors swallowed), `activateTab(tabId)`.
- Public state for the domains: `browser`, `fallback`, `fallbackDefaults`,
  `browserUuid`, `targets`, `sessions`, `debugger`, `connections`, `browserContexts`
  (starts as `{'DEFAULT'}`), `host`, `httpServer`, `wss`.
- `CdpServer.AUTOMATION_TAB_KIND` (`'cdp'`) and `DEFAULT_BROWSER_CONTEXT_ID`
  (`'DEFAULT'`) mirror [CdpDefaults](CdpDefaults.md).

## Bugs fixed in the port

- Legacy treated `browser.getTabs()` as an array and `createTab()` as the tab, but they
  return `{ success, tabs }` and `{ success, tab }`. So `stop()` never closed
  automation tabs, `Browser.close` threw, `PUT /json/new` answered id `"undefined"`, and
  `Target.createTarget` manufactured a second target with no tab (attach then failed).
- New sessions stored the raw settings object, whose `enabled` field does not exist,
  so `cdp.fallback.enabled` never enabled fallback for a session.
- Each start subscribed to tab events and never unsubscribed, so every stopped
  server kept reacting to tab events.
