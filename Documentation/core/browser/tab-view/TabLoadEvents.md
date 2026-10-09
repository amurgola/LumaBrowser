# TabLoadEvents

`core/browser/tab-view/TabLoadEvents.js`

Keeps a tab's loading, address, title and history in step with its webContents
load events. Every event passes [NavigationGenerations](NavigationGenerations.md)
first, so a stale completion never overwrites newer state.

## Methods

- `new TabLoadEvents({ channel, zoom, persisted, emitter })`.
- `wire(entry)` installs listeners for `did-start-loading`, `did-start-navigation`,
  `did-redirect-navigation`, `did-finish-load`, `did-stop-loading`, `did-navigate`,
  `did-fail-load`, `did-navigate-in-page` and `page-title-updated`.

## Behaviour

- Navigation events accept both Electron 43's positional arguments and the newer
  event-object shape.
- A settled load clears the spinner, refreshes back/forward and, for a hidden
  tab, re-applies its background priority (the renderer may be fresh).
- A commit tells the PermissionManager (ending allow-once grants for another
  origin), records the HTTP status, and shows an inline-rendered CSV's file URL
  instead of its data: URL. The error page keeps the failed URL with no history
  row and no `tabNavigated`. A real page clears the favicon when the host
  changes, records a visit (last 50), applies stored zoom, emits `tabNavigated`
  and saves a persisted tab's restore URL.
- A failure shows the [TabErrorPage](TabErrorPage.md), except for stale or aborted
  failures, internal and silent tabs, and failures of the error page itself.
- In-page navigations update the URL only; titles emit `tabTitleUpdated` and save
  a persisted tab's title.
