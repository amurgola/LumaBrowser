# HubIpcHandlers

`extensions/personal-hub/HubIpcHandlers.js`

Controller of the Hub's settings: every `ext.personal-hub.<channel>`
routes to the public API and replies `{ success: true, ...payload }` or
`{ success: false, error }` (IpcEnvelope). The same handlers answer two
callers: the settings tab over IPC, and the Dashboard's settings panel
([HubSettingsPanel](ui/widgets/HubSettingsPanel.md)) through the public
API's `settingsInvoke`, which may only use the channels in `PANEL_CHANNELS`.

## Methods (static)

- `register(ipc, api, { openUrl? })` -> the handler table
  (`{ channel: enveloped handler(event, ...args) }`): registers every
  channel on `ipc` and returns the table, so the same handlers can answer
  the Dashboard. `api` is the extension's public API; `openUrl(url)` opens
  a tab.
- `PANEL_CHANNELS`: the channels the Dashboard's settings panel may call:
  `listContexts`, `saveContexts`, `listContextChoices`, `summaryStatus`,
  `setSummariesEnabled`, `summarizeNow`, `listSummaryModels`,
  `setSummaryModel`, `listContacts`, `mergeContacts`,
  `splitContactIdentity`, `renameContact`, `keepContactsApart`.
- `async invoke(table, channel, args)`: one settings call from the
  Dashboard. It runs the same enveloped handler as the IPC channel (with a
  `null` event and `args` spread; anything but an array counts as no
  arguments), so the reply has the same shape. A channel outside
  `PANEL_CHANNELS`, or one with no handler, answers
  `{ success: false, error: '"<channel>" is not available from the
  Dashboard.' }` instead of running.

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
| `listContexts`, `saveContexts(contexts)` | `{ contexts }` |
| `listContextChoices` | `{ tabs, calendars, trackers }`, each `[{ value, label }]`: what can be ticked into a context |
| `listContacts({ query?, limit? })` | `{ contacts, suggestions }`: the people the Hub has seen and the pairs that may be one person |
| `mergeContacts(intoId, fromId)`, `splitContactIdentity(identityId)`, `renameContact(id, name)` | `{ contact }` |
| `keepContactsApart(aId, bId)` | `{ kept }`; the pair is not suggested again |
| `summaryStatus`, `setSummariesEnabled(enabled)` | `{ status }` |
| `listSummaryModels` | `{ models, chosen }`: `[{ value, label }]` with `value` as `<providerId>::<modelId>`, and the summariser slot's current pick (`''` when none) |
| `setSummaryModel(value)` | `{ status }`; `''` goes back to the app's active provider |
| `summarizeNow({ force? })` | `{ result: { written, failed, skipped }, status }` |

`listContextChoices` is built here from the public API: one tab entry per
signed-in session (the `tab` rows of `listConnections()`, one per partition,
labelled by the connection's name, title or app), every calendar source and
every task source by id and label. These are the values a context's
`partition`, `calendar` and `tasks` rules hold
([ContextsSection](ui/settings/ContextsSection.md)). The contact channels
serve [PeopleSection](ui/settings/PeopleSection.md), the summary channels
[SummarySection](ui/settings/SummarySection.md).

## Why one table

The summaries, contexts and people sections are shown in Settings > Hub and
in the Dashboard's settings panel. Both reach the very same handlers, so a
section behaves the same wherever it is shown and there is no second set of
reply shapes to keep in step. The list keeps the Dashboard to what shapes
the distilled view: everything that sets up an account (calendars,
trackers, sign-ins, the automation token) stays with the settings tab.

## Why the sign-in opens a tab

The OAuth consent page runs in a real browser tab (cookies, passkeys, the
account picker) and redirects to the gateway's loopback callback; the renderer
only needs to tell the user to finish there.
