# TabViewManager

`core/browser/TabViewManager.js`

Owns every browser tab as a WebContentsView inside the main BrowserWindow or a
window a tab was dragged out into (see [TabWindows](../../app/window/TabWindows.md)).
One registry and one strip order span every window, so automation, history and the
chat see every tab wherever it is drawn. Each renderer is only a positioning surface: it reports the content-area bounds and
renders the strip from tab events. TabManager (automation) reads tabs from here,
NetworkInterceptor attaches per view, and extensions follow tab lifecycle
through BrowserService.

The class is a facade (an EventEmitter) over small single-purpose classes in
[tab-view/](tab-view/); it holds no logic of its own beyond delegation.

## Construction

`new TabViewManager(mainWindow, { preloadPath, networkInterceptor, chromeExtensionService, adblockerService, db, faviconCache })`.
All dependencies except `mainWindow` are optional. Construction registers the
renderer IPC ([TabViewIpcController](tab-view/TabViewIpcController.md)), so
build exactly one per window.

Public fields: `mainWindow`, `preloadPath`, `networkInterceptor`,
`chromeExtensionService`, `adblockerService`, `db`, `faviconCache`, `downloads`
([DownloadManager](DownloadManager.md)). Read-only state getters: `tabs`
(Map id -> [TabEntry](tab-view/TabEntry.md)), `order` (strip order of ids),
`activeTabId`, `currentBounds`, `recentlyClosed`, `reservedPartitions`.

Statics: `SHARED_PARTITION` (`persist:main`), `AUTOMATION_KINDS`, `INTERNAL_KINDS`
(see [TabKinds](tab-view/TabKinds.md)), `MAIN_WINDOW_ID` (0, see [TabHosts](tab-view/TabHosts.md)).

`activeTabId`, `getActiveTabId()`, `currentBounds`, `boundsChanged` and `tabSwitched`
keep meaning the main window: the overlays, the tab preview, On Demand and
automation all live there.

## Methods

Lifecycle and strip ([TabLifecycle](tab-view/TabLifecycle.md), [TabActivation](tab-view/TabActivation.md), [TabLayout](tab-view/TabLayout.md)):

- `createTab(url = 'https://duckduckgo.com', options)` returns the serialized tab.
  Options: `silent`, `hidden`, `keepAlive`, `activate` (default true unless silent
  or hidden), `kind` (`user`, `cdp`, `llm`, `dashboard`), `partition`, `pinned`,
  `title`, `preloadPath`, `index`, `openerTabId`, `windowId` (the window to open
  in; without it a tab opened from a page joins its opener's window, else the main
  one; silent, hidden, pinned, internal and automation tabs are always the main window's).
- `closeTab(tabId)`: refuses pinned tabs; opens a start-page tab first when it is
  the main window's last regular strip tab (a detached window closes with its last
  tab instead); hides persisted tabs instead of destroying them.
- `closeTabInternal(tabId)`: destroys, bypassing pinned and last-tab rules (LLM tab teardown).
- `reopenClosedTab(windowId = 0)`, `moveTab(tabId, toIndex)`, `switchToTab(tabId)`,
  `showTab(tabId)`, `cycleTab(delta, windowId = 0)`, `selectTabByIndex(n, windowId = 0)`
  (n <= 0 is the last tab), `setBounds(bounds, windowId = 0)`, `destroyAll()`.

Windows ([TabHosts](tab-view/TabHosts.md), [TabTransfer](tab-view/TabTransfer.md)):

- `addWindow(window)` -> window id; `removeWindow(windowId)` (the window is closing:
  persisted tabs go back to the main window hidden, the rest close and can be
  reopened); `hasWindow(windowId)`, `getWindow(windowId)` (live window or null).
- `moveTabToWindow(tabId, windowId, { index, activate = true })` -> `{ success, windowId }`
  or `{ success: false, error }`; only movable tabs ([TabEntry](tab-view/TabEntry.md) `isMovable`).
- `windowOfTab(tabId)`, `windowIdOfTab(tabId)`, `windowIdForSender(webContents)`
  (a window's chrome renderer -> its id, anything else -> 0), `activeTabIdIn(windowId)`,
  `getWindowTabs(windowId)` (serialized strip tabs), `resyncWindow(windowId)` (replays
  a window's tabs to a reloaded renderer).

Persisted tabs ([PersistedTabs](tab-view/PersistedTabs.md), [KeepAliveSweep](tab-view/KeepAliveSweep.md)):

- `setTabPersistence(tabId, persist)`, `getPersistedTabs()`, `restorePersistedTabs()`,
  `startKeepAliveSweep({ initialDelayMs, intervalMs })`, `stopKeepAliveSweep()`,
  `activatePersistedTabs()`.

Restore tabs on restart ([SessionTabs](tab-view/SessionTabs.md)):

- `getSavedSession()`: `{ tabs: [{ url, title }], activeIndex }` from the last session, or `null` when the
  preference is off or nothing was saved.
- `sealSession()`: snapshots the strip and stops recording; `destroyAll()` calls it first.

Navigation and page tools ([TabLoader](tab-view/TabLoader.md), [TabHistory](tab-view/TabHistory.md), [TabZoom](tab-view/TabZoom.md), [TabPageTools](tab-view/TabPageTools.md)):

- `navigate(tabId, url)` -> `{ success, data: { navigatedTo, loaded, finalUrl, title, httpStatus?, redirected?, loadError?, loadState? } }`.
- `waitForLoad(tabId, timeoutMs = 15000)`, `reload(tabId, { ignoreCache })`, `stop(tabId)`,
  `goBack`, `goForward`, `getHistory`, `goToIndex(tabId, index)`,
  `setZoom(tabId, factor)`, `getZoom(tabId)`, `zoomBy(tabId, step)`,
  `findInPage(tabId, text, { forward, findNext, matchCase })`, `stopFindInPage(tabId, action)`,
  `print(tabId)`, `toggleDevTools(tabId)`, `clearCache()` ([TabSessionCache](tab-view/TabSessionCache.md)).

Accessors:

- `getEntry(tabId)`, `getWebContents(tabId)`, `getAllTabs({ includeSilent, includeInternal })`
  (strip order; hidden persisted tabs count as silent), `getActiveTabId()`,
  `findTabIdByWebContents(wc)`, `tabForWebContents(wc)` (`{ id, hidden, url }` or null),
  `addConsoleLog(tabId, level, message, source, line)`, `getConsoleLogs(tabId, { level })`.
- `performAccelerator(entry, action)` and `sendToRenderer(channel, payload)` for
  Luma On Demand, which forwards shortcuts typed in its panel.

Events: `viewAttached(webContents, entry)`, `tabCreated(tab)`, `tabSwitched(id)` (main
window), `windowTabSwitched(windowId, id)` (any window), `tabTransferred(id, fromWindowId, toWindowId)`,
`windowEmptied(windowId)` (a detached window lost its last strip tab),
`tabHidden(id)`, `tabClosed(id)`, `tabMoved(id, index)`, `boundsChanged(bounds)`,
`tabNavigated(id, url)`, `tabTitleUpdated(id, title)`, `notification({ tabId, notificationData, tab })`.

Renderer channels sent: `tab:state`, `tab:switched`, `tab:hidden`, `tab:closed`,
`tab:moved`, `tab:transferred`, `tab-view:accelerator`, `tab-view:found-in-page`
(each to the window the tab is drawn in), `tab-view:download`,
`notification-intercepted` (main window).

## How the pieces fit

- [TabRegistry](tab-view/TabRegistry.md) holds tabs, order and each window's active id;
  [TabHosts](tab-view/TabHosts.md) holds the windows and their bounds;
  [TabStateChannel](tab-view/TabStateChannel.md) serializes and sends to the right chrome;
  [TabTransfer](tab-view/TabTransfer.md) moves tabs between windows.
- [TabViewFactory](tab-view/TabViewFactory.md) builds and parks views and attaches
  per-tab services; [TabLifecycle](tab-view/TabLifecycle.md) creates and tears down.
- Each new tab's webContents is wired by [TabLoadEvents](tab-view/TabLoadEvents.md)
  (navigation state, guarded by [NavigationGenerations](tab-view/NavigationGenerations.md)),
  [TabPageEvents](tab-view/TabPageEvents.md) (crash, shortcuts, favicon, console),
  [TabPermissionHook](tab-view/TabPermissionHook.md), [TabPopupHandler](tab-view/TabPopupHandler.md)
  and [DataFileDownloadHook](tab-view/DataFileDownloadHook.md).
- [HiddenTabState](tab-view/HiddenTabState.md) mutes and deprioritizes hidden
  persisted tabs; [TabErrorPage](tab-view/TabErrorPage.md) owns the branded error page.
