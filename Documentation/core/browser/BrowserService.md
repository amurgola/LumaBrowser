# BrowserService

`core/browser/BrowserService.js`

The browser API extensions receive as `context.browser`. Extensions go through
this class, never the TabManager directly.

## Methods

Tab operations, each a straight delegation to the TabManager (all async):

- `getTabs(options)` -> `getAllTabs`; `createTab(url, options)`; `closeTab(tabId)`
- `navigate(tabId, url)`, `refresh(tabId)`, `executeJs(tabId, code)` -> `updateTab`
  with `{ type: 'navigate' | 'refresh' | 'executeJs', payload }`
- `waitForLoad(tabId, timeoutMs)`; `getSource` -> `getTabSource`; `screenshot` -> `screenshotTab`
- `click` -> `clickElement`; `clickAt` (trusted click at a viewport point); `fill` -> `fillForm`
- `observePage(tabId)` (numbered element digest that tags `data-luma-ref`)
- `typeInto`; `waitFor` -> `waitForElement`; `scroll` -> `scrollPage`; `pressKey`
- `getElement`, `getTable`, `getConsoleLogs`, `handleDialog`, `extractData`
- `selectOption`, `setDate`, `setSlider`, `collectList`, `checkSelectors`

Visual grounding:

- `setVisualGrounding(service)` wires the grounding service (it is constructed after this one).
- `hasVisualGrounding()` is true when a grounding model is routed and available.
- `locate(tabId, options)` asks the grounding service to find a described element;
  `options.click` routes to `clickDescribed` instead. Without a service it returns
  `{ success: false, error: 'Visual grounding is not available' }`.

Registries and events:

- `attachCDP(extensionId, listener)` registers a CDP listener and returns a detach function.
- `getAllCDPListeners()` returns every registered listener, flattened across extensions.
- `registerWebviewPreload(extensionId, scriptPath)` / `getWebviewPreloads()` (a Map; last registration per extension wins).
- `onTabNavigated(cb)`, `onTabCreated(cb)`, `onTabClosed(cb)`, `onWebviewAttached(cb)`
  each return an unsubscribe function.
- `emit(event, ...args)` is called by the shell (main.js forwards TabViewManager
  events). A throwing listener is logged and does not stop the others.
- `getTabManager()`, `getNetworkInterceptor()`, `getMainWindow()` are escape hatches
  for legacy callers.
- `BrowserService.EVENTS` lists the four event names.
