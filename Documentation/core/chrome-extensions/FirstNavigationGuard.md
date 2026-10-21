# FirstNavigationGuard

`core/chrome-extensions/FirstNavigationGuard.js`

Restarts a page's first navigation when Electron stalled it because the page was
created while a Chrome extension was still loading into its session.

## Methods

- `new FirstNavigationGuard(wc, { stallMs = 1500 })` starts watching: it keeps
  the URL of the first main-frame `did-start-navigation` and sets `done` on a
  `did-navigate` or a main-frame `did-fail-load`. A webContents without `on()`
  (a test double) is `done` from the start.
- `restartIfStalled()` waits `stallMs` unless already `done`, stops listening,
  then calls `loadURL` with the remembered URL when the navigation has neither
  committed nor failed and `isLoading()` is false. Resolves `true` when it
  restarted.
- `dispose()` stops listening.

## Why

Measured on Electron 43 (2026-10-21): a webContents created in a session while
`session.loadExtension` is pending there never finishes its first navigation.
`did-start-navigation` fires, then nothing: no commit, no failure, `getURL()`
stays empty and `isLoading()` drops to false within ~50 ms. A second `loadURL`
after the load settles works. With Bitwarden installed this hung the pinned LLM
tab on boot (its `persist:main` load raced the tab), and `InternalTabLoader`
never retried because no failure was reported. `wc.reload()` does nothing here
since nothing committed. A slow but healthy navigation keeps `isLoading()`
true, so it is never restarted.

Used by `ChromeExtensionService.ensureLoadedForWebContents`. This is the
fallback: the primary fix is that `TabLifecycle` does not start a tab's first
navigation until `ChromeExtensionService.loadsInFlight` settles. The second
form of the stall (the page keeps `isLoading()` true and never commits, seen on
the user's profile for restored tabs) is only prevented by that ordering, since
from outside it looks like a slow server.
