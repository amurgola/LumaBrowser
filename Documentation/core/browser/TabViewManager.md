# TabViewManager

`core/browser/TabViewManager.js`

Owns every browser tab as a WebContentsView inside the main BrowserWindow. The
renderer is only a positioning surface: it reports the content-area bounds and
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
(see [TabKinds](tab-view/TabKinds.md)).

## Methods

Lifecycle and strip ([TabLifecycle](tab-view/TabLifecycle.md), [TabActivation](tab-view/TabActivation.md), [TabLayout](tab-view/TabLayout.md)):

- `createTab(url = 'https://duckduckgo.com', options)` returns the serialized tab.
  Options: `silent`, `hidden`, `keepAlive`, `activate` (default true unless silent
  or hidden), `kind` (`user`, `cdp`, `llm`, `dashboard`), `partition`, `pinned`,
  `title`, `preloadPath`, `index`, `openerTabId`.
- `closeTab(tabId)`: refuses pinned tabs; opens a start-page tab first when it is
  the last regular strip tab; hides persisted tabs instead of destroying them.
- `closeTabInternal(tabId)`: destroys, bypassing pinned and last-tab rules (LLM tab teardown).
- `reopenClosedTab()`, `moveTab(tabId, toIndex)`, `switchToTab(tabId)`,
  `showTab(tabId)`, `cycleTab(delta)`, `selectTabByIndex(n)` (n <= 0 is the last tab),
  `setBounds(bounds)`, `destroyAll()`.

Persisted tabs ([PersistedTabs](tab-view/PersistedTabs.md), [KeepAliveSweep](tab-view/KeepAliveSweep.md)):

- `setTabPersistence(tabId, persist)`, `getPersistedTabs()`, `restorePersistedTabs()`,
  `startKeepAliveSweep({ initialDelayMs, intervalMs })`, `stopKeepAliveSweep()`,
  `activatePersistedTabs()`.

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

Events: `viewAttached(webContents, entry)`, `tabCreated(tab)`, `tabSwitched(id)`,
`tabHidden(id)`, `tabClosed(id)`, `tabMoved(id, index)`, `boundsChanged(bounds)`,
`tabNavigated(id, url)`, `tabTitleUpdated(id, title)`, `notification({ tabId, notificationData, tab })`.

Renderer channels sent: `tab:state`, `tab:switched`, `tab:hidden`, `tab:closed`,
`tab:moved`, `tab-view:accelerator`, `tab-view:found-in-page`, `tab-view:download`,
`notification-intercepted`.

## How the pieces fit

- [TabRegistry](tab-view/TabRegistry.md) holds tabs, order and the active id;
  [TabStateChannel](tab-view/TabStateChannel.md) serializes and sends to the chrome.
- [TabViewFactory](tab-view/TabViewFactory.md) builds and parks views and attaches
  per-tab services; [TabLifecycle](tab-view/TabLifecycle.md) creates and tears down.
- Each new tab's webContents is wired by [TabLoadEvents](tab-view/TabLoadEvents.md)
  (navigation state, guarded by [NavigationGenerations](tab-view/NavigationGenerations.md)),
  [TabPageEvents](tab-view/TabPageEvents.md) (crash, shortcuts, favicon, console),
  [TabPermissionHook](tab-view/TabPermissionHook.md), [TabPopupHandler](tab-view/TabPopupHandler.md)
  and [DataFileDownloadHook](tab-view/DataFileDownloadHook.md).
- [HiddenTabState](tab-view/HiddenTabState.md) mutes and deprioritizes hidden
  persisted tabs; [TabErrorPage](tab-view/TabErrorPage.md) owns the branded error page.
