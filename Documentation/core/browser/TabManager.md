# TabManager

`core/browser/TabManager.js`

The browser automation API every surface uses: REST ([BrowserController](BrowserController.md)),
MCP ([BrowserMcpTools](BrowserMcpTools.md) through [BrowserService](BrowserService.md)), the chat
tools, [VisualGroundingService](vision/VisualGroundingService.md), [LlmFallbackService](LlmFallbackService.md),
and [ResolutionCache](ResolutionCache.md). Every method runs directly on a tab's
webContents (no renderer round trip) and answers the service envelope `{ success, data?, error? }`.

The class is a facade over single-purpose classes in [tab-manager/](tab-manager/); it holds no logic
beyond delegation and one guard.

## Construction

`new TabManager(tabViewManager, { nativeImage })`. `tabViewManager` is the
[TabViewManager](TabViewManager.md) (public field `tabViewManager`, read by
[TabPageAccess](resolution-cache/TabPageAccess.md) and the CDP and Selenium drivers). `nativeImage`
is Electron's module, optional: it is loaded lazily the first time a screenshot is rescaled.

## Methods

All async. Every per-tab method answers `{ success: false, error: 'Tab N not found' }` for an unknown
tab and turns a throw into `{ success: false, error: message }`.

Tabs ([TabControl](tab-manager/TabControl.md)):

- `getAllTabs({ includeSilent })` -> `{ success, tabs }`; `createTab(url, options)` -> `{ success, tab }`.
- `closeTab(tabId)`, `waitForLoad(tabId, timeoutMs)`: straight to the TabViewManager.
- `getConsoleLogs(tabId, { level })` -> `{ success, data: logs }`.
- `updateTab(tabId, { type, payload })`: `navigate`, `refresh`, `executeJs` (`data.result`), `activate` (`data.activeTabId`).

Reading the page:

- `getTabSource(tabId, { type })` -> `{ success, source, extractionType }` ([PageSource](tab-manager/PageSource.md)).
  Types: `clean` (default), `full`, `markdown`, `text`, `minimal`, `analyze`, `structural`, `semanticTree`.
- `screenshotTab(tabId, { fullPage, marks, cssScale })` -> `data: { screenshot, mimeType, frame?, marks? }` ([TabScreenshot](tab-manager/TabScreenshot.md)).
- `observePage(tabId)` -> `data: { text, count, dropped, title, url }` ([PageObserver](tab-manager/PageObserver.md)).
- `getElement(tabId, { selector, text })`, `checkSelectors(tabId, selectors)` -> `{ success, results }` ([ElementInspector](tab-manager/ElementInspector.md)).
- `getTable(tabId, { selector, rowSelector, cellSelector })` ([TableReader](tab-manager/TableReader.md)).
- `extractData(tabId, { baseSelector, childSelectors, preferTableStructure })` -> `{ success, data, rowCount, extractionMode?, duplicateFieldGroups?, nullFields?, constantFields? }` ([RowDataExtractor](tab-manager/RowDataExtractor.md)).
- `getInteractableElements(tabId, { limit, includeHidden })` -> `{ success, data, truncated }` ([InteractableElements](tab-manager/InteractableElements.md)).
- `findByAccessibleAttributes(tabId, description)` -> `{ success, selector, strategy }` ([AccessibleAttributeMatcher](tab-manager/AccessibleAttributeMatcher.md)).
- `waitForElement(tabId, { selector, text, state, timeout })` ([ElementWaiter](tab-manager/ElementWaiter.md)).
- `waitForSettle(tabId, { quietMs, maxMs })` -> `data: { settled, waitedMs, mutations }` ([SettleWaiter](tab-manager/SettleWaiter.md)).
- `pointInfo(tabId, x, y)`: what is under a viewport point ([PointClicker](tab-manager/PointClicker.md)).

Acting on the page (input actions add `data.evidence` and, when the URL moved, `urlChanged` and `newUrl`):

- `clickElement(tabId, { selector, text, ref })` ([ElementClicker](tab-manager/ElementClicker.md)).
- `clickAt(tabId, { x, y, button, clickCount })` ([PointClicker](tab-manager/PointClicker.md)).
- `typeInto(tabId, { selector, ref, text, submit, clear })` ([FieldTyper](tab-manager/FieldTyper.md)).
- `pressKey(tabId, { key, selector, ref })` ([KeyPresser](tab-manager/KeyPresser.md)).
- `scrollPage(tabId, { selector, direction, amount })` ([PageScroller](tab-manager/PageScroller.md)).
- `fillForm(tabId, { fields })` ([FormFiller](tab-manager/FormFiller.md)); `handleDialog(tabId, { action, promptText })` ([DialogHandler](tab-manager/DialogHandler.md)).
- `selectOption`, `setDate`, `setSlider`, `collectList` (`tabId, options`): [WidgetDriver](widgets/WidgetDriver.md) on the tab's webContents.

## How the pieces fit

Each per-tab call wraps the entry in a [TabPage](tab-manager/TabPage.md) (script runs, the
`{ success, data }` envelope, the [ActionWatcher](ActionWatcher.md)). Input actions resolve their
target with [TargetScripts](tab-manager/TargetScripts.md), deliver trusted input through
[InputDriver](InputDriver.md), settle and diff through the watcher, and shape the reply with
[NavigationReply](tab-manager/NavigationReply.md).
