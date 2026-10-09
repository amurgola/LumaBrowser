# HubIpcHandlers

`extensions/personal-hub/HubIpcHandlers.js`

IPC controller of the Hub settings tab: every `ext.personal-hub.<channel>`
routes to the public API and replies `{ success: true, ...payload }` or
`{ success: false, error }` (IpcEnvelope).

## Channels

| Channel | Reply |
|---|---|
| `listCalendarSources` | `{ sources }` |
| `addCalendarSource(input)`, `updateCalendarSource(id, patch)` | `{ source }` |
| `removeCalendarSource(id)` | `{ removed }` |
| `startOAuth(sourceId)` | `{ url }`; the sign-in tab is opened through `openUrl` |
| `listTaskSources` | `{ sources }` |
| `addTaskSource(input)`, `updateTaskSource(id, patch)` | `{ source }` |
| `removeTaskSource(id)` | `{ removed }` |
| `resetStatusLinks(sourceId)` | `{ source }`; the source's status links are forgotten |
| `discoverTaskSource({ sourceId?, token? })` | the discovery tree |
| `listColumns`, `saveColumns(columns)` | `{ columns }` |
| `syncNow(opts)` | `{ results }` (a refused sync is an error) |
| `syncStatus` | `{ status }` |
| `getInboundInfo` | `{ token, baseUrl, queueUrl, enrichUrl, oauthCallbackUrl }` |
| `rotateInboundToken` | `{ token }` |
| `listConnections` | `{ checkedAt, connections }` |
| `checkConnections` | `{ checkedAt, connections }` after a full check |
| `showConnectionTab(key)` | `{}`; the connection's tab comes forward |
| `openSignInTab('google' \| 'microsoft')` | `{ tabId, partition }` of the new persisted tab |
| `listAccountCalendars` | `{ accounts }` |
| `setAccountCalendar(input)` | `{ accounts }` after adding or removing the calendar |

## Why the sign-in opens a tab

The OAuth consent page runs in a real browser tab (cookies, passkeys, the
account picker) and redirects to the gateway's loopback callback; the renderer
only needs to tell the user to finish there.
