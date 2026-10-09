# BrowserRenderer

`core/browser/ui/BrowserRenderer.js` (ES module)

The shell renderer's read-only view of its tabs for extension renderers (`context.browserRenderer`): lookups over the shell's tab map and tab lifecycle events.

## Methods

- `init(tabs, getActiveTabId)`: the shell's `Map<tabId, entry>` and a getter.
- `getTabs()` `[{ id, url, title, active }]` ([] before init), `getActiveTabId()`
  (0 before init), `getTab(tabId)` (entry or null).
- `onTabNavigated(cb(tabId, url))`, `onTabCreated(cb(tabId))`,
  `onTabClosed(cb(tabId))`, `onActiveTabChanged(cb(tabId))`,
  `onUrlChanged(cb(tabId, url))`: each returns its unsubscribe function.
- `emit(event, ...args)`: the shell calls it on tab changes (`tabCreated`,
  `tabClosed`, `tabNavigated`, `activeTabChanged`, `urlChanged`); a throwing
  listener is logged and the rest still run. Listeners are copied before the
  loop, so unsubscribing during an emit is safe.

## Globals

None (the shell decides whether to publish an instance).
