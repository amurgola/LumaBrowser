# ChromeTabs

`core/chrome-extensions/bridge/ChromeTabs.js` (main process)

`chrome.tabs` for extensions, sourced from the app's tab manager. Electron's
own `chrome.tabs` calls a tab active only while its page holds keyboard focus
(so nothing is active while the address bar or an extension popup has it),
gives tabs no `status` or real `windowId`, and never fires a tab event. A
password manager relies on all three: Bitwarden asks for the active tab of the
current window to decide which logins to offer, and recomputes its badge,
right-click items and inline menu on `tabs.onActivated` and `tabs.onUpdated`.

One instance, owned by [ShimBridge](ShimBridge.md). It extends `EventEmitter`.

## Methods

- `new ChromeTabs({ broadcast, app, webContents, access })`:
  `broadcast(session, ns, name, argsFor)` reaches the extensions of a session
  (every session when it is `null`); `argsFor(extId)` returns that extension's
  arguments, or `null` to leave it out. `app` and `webContents` are Electron's
  (seams for tests); `access` defaults to
  [ExtensionTabAccess](ExtensionTabAccess.md).
- `watch(tabViewManager)`: called once from `TabSurfaces`, as the tab manager
  is built and before it has a tab. Follows `viewAttached` (a new tab) and
  `windowTabSwitched`, and the app's `browser-window-focus`.
- `query(session, extId, queryInfo)`: the session's tabs that match, in strip
  order. Honoured filters: `active`, `highlighted`, `pinned`, `audible`,
  `incognito`, `discarded`, `autoDiscardable`, `muted`, `status`, `index`,
  `windowId` (`-2` is the current window), `currentWindow`,
  `lastFocusedWindow`, `windowType` (only `normal` matches) and `url` (one
  [MatchPattern](MatchPattern.md) or a list). `title` is not filtered on.
- `get(session, extId, tabId)`: the tab, or `null` when the id is not a tab of
  that session.
- `tabOf(webContents)`: the full [ChromeTab](ChromeTab.md) for a page the user
  acted on (a context menu click), or `null` when it is not a tab.
- `activeTabs()`: `[{ window, tabId }]`, every browser window with the tab it
  is showing; for [ChromeActionBadges](ChromeActionBadges.md).
- `ChromeTabs.windowIdOf(hostId)`: Chrome window ids are positive, the app's
  main window is host 0, so the id is `hostId + 1`.

## What a tab is

Every entry of the tab manager whose webContents belongs to the asking
session, the app's own pages and silent agent tabs included. The id is the
webContents id, the same id Electron's `chrome.tabs.sendMessage`,
`chrome.scripting` and a message sender's `tab.id` use. `active` is true for
the tab each window has on screen; the current window is the browser window
that last had focus, so an extension popup taking focus changes nothing.

## Who may read the address

`url` and `title` are withheld from an extension that holds neither the
`tabs` permission nor a host permission for the page, as in Chrome; a `url`
filter never matches such a tab, and `onUpdated` changes to the address or
title are not sent to it (loading state still is). The app's own pages
(`entry.isInternal()`: the LLM tab, the new tab page) are readable by nobody,
like Chrome's `chrome://` pages.

## Events sent to extensions

| source | event |
|---|---|
| tab manager `viewAttached` | `tabs.onCreated(tab)` |
| `did-start-loading` / `did-stop-loading` | `tabs.onUpdated(id, { status }, tab)` |
| `did-navigate`, main-frame `did-navigate-in-page` | `tabs.onUpdated(id, { url }, tab)` |
| `page-title-updated` | `tabs.onUpdated(id, { title }, tab)` |
| webContents `destroyed` | `tabs.onRemoved(id, { windowId, isWindowClosing: false })` |
| tab manager `windowTabSwitched` | `tabs.onActivated({ tabId, windowId })` |
| `browser-window-focus` on a browser window | `windows.onFocusChanged(windowId)`, in every session, when the window changed |

## Events for the app

`'activated'` (hostId), `'navigated'` (tabId, on a main-frame document
change) and `'removed'` (tabId). ShimBridge uses them to republish and clear
toolbar badges.
