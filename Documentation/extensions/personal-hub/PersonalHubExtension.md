# PersonalHubExtension

`extensions/personal-hub/PersonalHubExtension.js`

Main-process side of the Hub: one place for the user's calendars (Google,
Microsoft 365 and ICS feeds), the conversation queue built from intercepted
chat and mail notifications (enriched by an automation such as n8n), and a
unified task board synced with ClickUp. Agents reach it through the `hub_*`
tools, the Dashboard through its three widgets, live modules through
`luma.ext('personal-hub')`, and automations through `/api/hub`.

## Methods

- `new PersonalHubExtension(overrides?)`: test overrides `{ fetchImpl, broadcast, secrets, now, getCookies, alert, sleep }`.
- `activate(context)`: [HubSchema](HubSchema.md)`.ensure(context.db)`; builds
  the repositories, a [TriggerSecrets](../../core/llm-server/chat/triggers/TriggerSecrets.md)
  store over the raw database (ids namespaced `hub:cal:*` and `hub:task:*`),
  [CalendarService](calendar/CalendarService.md) with the ICS, signed-in
  Google session (cookies read through
  [SessionCookies](calendar/session/SessionCookies.md)), Microsoft read through
  a persisted Teams or Outlook tab
  ([MicrosoftSessionCalendarProvider](calendar/providers/MicrosoftSessionCalendarProvider.md)),
  Google OAuth and Microsoft OAuth providers and the OAuth flow,
  the connections layer over `context.browser` ([SessionTabs](connections/SessionTabs.md),
  [GoogleAccounts](connections/GoogleAccounts.md),
  [MicrosoftAccounts](connections/MicrosoftAccounts.md),
  [ConnectionMonitor](connections/ConnectionMonitor.md) with a
  [DesktopAlert](connections/DesktopAlert.md),
  [AccountCalendars](connections/AccountCalendars.md)), [InboxService](inbox/InboxService.md),
  [BoardService](board/BoardService.md) with the ClickUp provider,
  [HubSyncScheduler](sync/HubSyncScheduler.md), [InboundToken](InboundToken.md)
  and the [HubService](HubService.md) facade; subscribes to
  `context.extensions['notification-interceptor'].onIngest` so every
  intercepted notification feeds the queue; registers
  [HubIpcHandlers](HubIpcHandlers.md); starts the master tick and the
  connection monitor; resolves the public API.
- `deactivate()`: stops the tick and the monitor and drops the notification subscription.
- `getApi()`: the public API, or null while inactive.

## Public API

Every public HubService method under its own name (the manifest's
`dashboard.api` list names the subset the Dashboard and live modules may call),
plus `inboundToken()` (the InboundToken), `inboundInfo()` (`{ token, baseUrl,
queueUrl, enrichUrl, oauthCallbackUrl }`), `setGatewayBaseUrl(url)` (called by
`routes.js` once the gateway is mounted; the OAuth redirect URI derives from it)
and `getGatewayBaseUrl()`. Before the routes mount, `http://127.0.0.1:3000` is
assumed.

## Entry files

- `manifest.js`: id `personal-hub`, name Hub, the eight `hub_*` tables,
  optional `core:browser` (reading calendars through the persisted tabs,
  watching them for sign-outs, sign-in and "open" links) and
  `ext:notification-interceptor` (the notification feed), a top-level
  settings tab (`settings.placement: 'tab'`),
  `routes` at `/api/hub`, `mcpTools`, and the `dashboard` contribution
  (widgets `board`, `agenda`, `inbox`, each with `context: 'widgetContext'`
  so the chat's `@dashboard` can read it ([HubContext](HubContext.md)), their
  shared assets including `TaskChrome.js` and `StatusPicker.js`, and the
  `api` method allow-list,
  which covers the board's `listTaskTargets`, `setTasksHidden`, `linkStatus`
  and `addStatusColumn`, and `listConnections` and `showConnectionTab` for the
  widgets' signed-out strip).
- `main.js`: `{ activate, deactivate, getApi }` delegating to one instance.
- `mcp-tools.js`: `{ tools, handler }` through [HubTools](HubTools.md).
- `routes.js`: mounts [HubRoutes](HubRoutes.md) and reports the gateway base URL.
- `renderer.js`: sets `window.__ext_personal_hub` over [ui/HubRenderer](ui/HubRenderer.md).

## Why an extension

The extension system already gives a feature its own tables, REST routes and
MCP tools that every agent surface (chat, sub-agents, background runs,
external MCP clients) picks up automatically, so the Hub needed no new core
wiring for data access. What core gained instead is generic: extension
Dashboard widgets and the `luma.ext()` bridge
([DashboardContribution](../../core/shell/extensions/DashboardContribution.md)).

## Network notes

The gateway's API security policy applies to `/api/hub` as to every `/api`
route: fresh profiles answer loopback only, so an automation on another
machine needs the network mode widened (Settings, Security). The OAuth callback
is a loopback redirect from the sign-in tab and needs nothing extra.
