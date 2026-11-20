# PersonalHubExtension

`extensions/personal-hub/PersonalHubExtension.js`

Main-process side of the Hub: one place for the user's calendars (Google,
Microsoft 365 and ICS feeds), the activity feed built from intercepted
notifications of every kind (enriched by an automation such as n8n), and a
unified task board synced with ClickUp. On top of those sits the distilled
view for someone working across many companies: contexts everything is
filed under, one activity summary card per context, a focus view of the
task in hand and the little that needs the user, a memory of the people who
reach them, and conversation snapshots read from their own signed-in tabs
when a one-line notification is not enough. Agents reach it through the
`hub_*` tools, the Dashboard through its four widgets, live modules through
`luma.ext('personal-hub')`, and automations through `/api/hub`.

## Methods

- `new PersonalHubExtension(overrides?)`: test overrides `{ fetchImpl, broadcast, secrets, now, getCookies, alert, sleep, llm }`
  (`llm` stands in for `context.llm`, the app's LLM service).
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
  [HubSyncScheduler](sync/HubSyncScheduler.md), [InboundToken](InboundToken.md),
  [ContactService](contacts/ContactService.md) (given `now`),
  [ContextService](context/ContextService.md) (built after the contact
  service and given it as `people`, so a person's own context can file what
  they send directly), then `_refit` and `_seedContacts` over the stored
  feed, one [SnapshotRepository](snapshot/SnapshotRepository.md)
  shared by the [ConversationReader](snapshot/ConversationReader.md) and the
  [ContactProfiler](contacts/ContactProfiler.md) (over the contact service,
  the inbox and the LLM service), one
  [ConversationLocator](snapshot/ConversationLocator.md) (over the session
  tabs, with a [SlackSidebar](snapshot/SlackSidebar.md) over the tabs,
  `context.browser` and the extension's database) shared by the
  reader and the [ConversationOpener](snapshot/ConversationOpener.md) (both
  over `context.browser`),
  [ActivitySummarizer](summary/ActivitySummarizer.md) (over `context.llm`,
  or `null` without one, with the reader as `reader`, the contact service
  as `people` and a [CalendarEvidence](summary/CalendarEvidence.md) over the
  calendar service as `meetings`), [FocusService](focus/FocusService.md)
  and the [HubService](HubService.md) facade (given `contacts`, `profiler`,
  `reader` and `opener` too). The calendar service is given the
  extension's clock (`now`, as milliseconds), so a test's clock reaches the
  sync window. `activate` awaits `secrets.open()` so the stored tokens are decrypted into memory
  before the schedulers start and the first sync asks for one; subscribes to
  `context.extensions['notification-interceptor'].onIngest` so every
  intercepted notification lands in the activity feed, together with the
  persisted tab that raised it (`_tabOf`); registers
  [HubIpcHandlers](HubIpcHandlers.md) and keeps the handler table it
  returns, adding `api.settingsInvoke(channel, args)`
  (`HubIpcHandlers.invoke` over that table), so the Dashboard's settings
  panel reaches the same handlers as the settings tab for the channels it
  may use; starts the master tick and the connection monitor; resolves the
  public API.
- `deactivate()`: stops the tick, the monitor and the summariser's pending
  timer, drops the notification subscription, and awaits `secrets.idle()` so a
  token saved a moment ago reaches the database.
- `getApi()`: the public API, or null while inactive.
- `static _tabOf(notification, tabs)`: `{ partition, title, url }` of the
  persisted tab a notification names by `tabId`
  ([SessionTabs](connections/SessionTabs.md)`.persisted()`), or `null`. The
  partition is stored with the notification, which is what lets a context's
  tab rule file the item.
- `static _observe(threadId, notificationId, { inbox, contexts, contacts })`:
  whoever sent the notification that just reached a feed item is remembered
  as a person. It reads the item, takes the notification of that id (else
  the newest), files the item with that notification as its last one
  ([ContextService](context/ContextService.md)`.forItem`, so the context is
  the one the feed shows the item under) and calls `contacts.observe({ app,
  sender, contextId, at })`. A notification with no sender is skipped.
  Never throws (a failure is logged): the feed must not depend on it.
- `static _refit({ db, inbox, contexts, contacts, contactRows })`: once
  after the rules that read a notification changed, the stored feed is read
  again with them and the people memory is put right. It runs when the
  setting `feed.rules` (`FEED_RULES_KEY`, 1 when never set) is below
  `FEED_RULES` = 2: [InboxService](inbox/InboxService.md)`.reclassify()`,
  then [ContactTidy](contacts/ContactTidy.md)`.run(changed, { contextOf })`
  with `contextOf` resolving a notification's url, partition, host, sender
  and app (`ContextService.resolve`), then the setting is raised to
  `FEED_RULES`. Never throws: a failure is logged and the setting stays, so
  the pass is tried again at the next start. `FEED_RULES` is to be raised
  whenever [NotificationClassifier](inbox/NotificationClassifier.md) reads
  a sender or a title differently.
- `static _seedContacts({ inbox, contexts, contacts })`: the first time
  (while there is no contact), the people memory is filled from the
  notification log already kept: the newest `BACKFILL_NOTIFICATIONS` = 3000
  notifications, oldest first, each sender filed under the context its
  notification resolves to, through `contacts.backfill`. Never throws.

## Events

Every service is given one `emit(type, payload)`. It announces the change to
the renderers through [HubBroadcast](HubBroadcast.md), and a `thread.changed`
also does two things. When its reason is `notification` or `pushed` (a new
notification reached an item) the sender is noted through
`_observe(payload.threadId, payload.notificationId, ...)`. Then the
summariser's `schedule()` is called, so any change to the feed (a
notification, a dismissal, an enrichment) asks for fresh summaries after the
debounce. The distilled view's own types are `context.changed`,
`summary.changed`, `focus.changed` and `contact.changed`.

## Public API

Every public HubService method under its own name (the manifest's
`dashboard.api` list names the subset the Dashboard and live modules may call),
plus `inboundToken()` (the InboundToken), `inboundInfo()` (`{ token, baseUrl,
queueUrl, enrichUrl, oauthCallbackUrl }`), `setGatewayBaseUrl(url)` (called by
`routes.js` once the gateway is mounted; the OAuth redirect URI derives from it),
`getGatewayBaseUrl()` and `settingsInvoke(channel, args)` (one settings call
from the Dashboard's settings panel, answered with the settings tab's reply
envelope; see [HubIpcHandlers](HubIpcHandlers.md)`.invoke`). Before the routes
mount, `http://127.0.0.1:3000` is assumed.

## Entry files

- `manifest.js`: id `personal-hub`, name Hub, the fourteen `hub_*` tables
  (the first eight plus `hub_contexts`, `hub_context_rules`,
  `hub_summaries`, `hub_contacts`, `hub_contact_identities` and
  `hub_snapshots`), optional `core:llm-service` with one slot `summarizer`
  (label `Hub Summaries Model`, not required), which the app registers as
  `personal-hub.summarizer`: the model that writes the activity summaries,
  picked in Settings > Hub or the Dashboard's settings panel and falling back to the active provider when
  empty; optional `core:browser` (reading calendars through the persisted
  tabs, watching them for sign-outs, sign-in and "open" links) and
  `ext:notification-interceptor` (the notification feed), a top-level
  settings tab (`settings.placement: 'tab'`),
  `routes` at `/api/hub`, `mcpTools`, and the `dashboard` contribution
  (widgets `focus`, `board`, `agenda` and `inbox`, the last titled
  `Activity`, each with `context: 'widgetContext'`
  so the chat's `@dashboard` can read it ([HubContext](HubContext.md)), their
  shared assets including `TaskChrome.js`, `StatusPicker.js`,
  [HubSettingsPanel](ui/widgets/HubSettingsPanel.md)`.js` and the five
  settings files it shares with Settings > Hub (`ui/settings/HubSection.js`,
  `SummarySection.js`, `ContextsSection.js`, `PeopleSection.js` and the
  `ContactProfileForm.js` that section imports; the Dashboard serves widget
  files unbundled, so every imported file is listed), and the
  `api` method allow-list,
  which covers the board's `listTaskTargets`, `setTasksHidden`, `linkStatus`
  and `addStatusColumn`, the activity feed's `threadToTask` and
  `setThreadsState`, the distilled view's `listContexts`, `listSummaries`,
  `summarizeNow`, `getFocus` and `setFocusTask`, `snapshotThread` (the
  activity widget's `Read`), `openThread` (its `Open`), `listContacts` and
  `settingsInvoke` (the
  settings panel's one call), and
  `listConnections` and `showConnectionTab` for the widgets' signed-out
  strip).
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
