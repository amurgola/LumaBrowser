# InternalTabLoader

`core/shell/InternalTabLoader.js`

Load guard for internal app tabs (the pinned LLM tab and the Dashboard tab) that
are served over the local REST gateway with a `file://` fallback.

## Methods

- `InternalTabLoader.wire(service, wc, { retries = 8, retryDelayMs = 600 })`
  attaches load tracking, retry and fallback to the tab's webContents and
  returns the loader. Sets `service.tabLoadedOk = false` immediately.
- `InternalTabLoader.reloadIfStale(service, wc)` reloads the tab onto
  `service.tabHtmlUrl` unless it is already loaded there. Call it after the
  REST gateway has started.

## Host-service contract

Both `LLMServerService` and `DashboardService` expose:

- `tabHtmlUrl`: current target URL (http once the gateway base URL is known)
- `tabHtmlFileUrl`: the `file://` fallback
- `tabLoadedOk`: written by the loader, read by `reloadIfStale`

When `tabHtmlUrl === tabHtmlFileUrl`, gateway serving is disabled and neither
method retries or reloads.

## Why

An internal tab can be created before the gateway listens (boot races; on first
run the gateway is deferred until the setup wizard finishes). A failed main-frame
load still commits Chromium's error page, which fires `did-finish-load`, so
"finished" alone does not mean the real page is up. The loader tracks failure
per navigation, retries the http URL `retries` times, then loads the `file://`
fallback so the tab always shows something. `ERR_ABORTED` (-3) is normal during
navigation and ignored, as are subframe failures.

## Stall watchdog

Every main-frame `did-start-navigation` arms a `STALL_MS` (5 s) timer;
`did-navigate`, a main-frame `did-fail-load` or `destroyed` disarms it. When it
fires the navigation has neither committed nor failed, which for a page served
by the local gateway means it stalled: the loader counts an attempt and loads
the next URL (the http URL, or the file:// copy once the retries are used up).

Seen on 2026-10-21: on the user's profile the LLM tab's first load, released
by `TabLifecycle` the moment Bitwarden finished loading into `persist:main`,
still hung (loading, nothing committed) while every other tab loaded. A second
`loadURL` fixed it at once. See
[FirstNavigationGuard](../chrome-extensions/FirstNavigationGuard.md).
