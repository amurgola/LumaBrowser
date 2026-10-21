# WorkTabs

`extensions/site-apis/builder/WorkTabs.js`

One visible work tab per builder conversation, opened in the site's session partition at the site's start URL
with `browser.createTab(startUrl, { partition, activate: false })`, so it shares the persisted tab's sign-in and
never steals focus. The tab id lives in the conversation meta (`workTabId`) and in an in-memory map.

## Methods

- `new WorkTabs({ browser, logger })`: `browser` is `context.browser` (`createTab`, `getTabs`, `closeTab`) or null.
- `available`: whether a browser is wired.
- `ensure(conversationId, site, knownTabId?)`: the open work tab id, reusing `knownTabId` (from the meta) or
  the registry's id while `browser.getTabs()` still lists it, else opening a new one. Null without a browser or
  when creation fails (logged, never thrown).
- `isOpen(tabId)`: whether the tab list has it.
- `close(conversationId, tabId?)`: closes the conversation's work tab (the given id when the registry does not
  know it, after a restart).
- `dispose()`: closes every registered work tab.

## Decisions

- Not hidden and not silent: the user watches the demonstration in the strip. The replay runner's `SiteTab` is
  the hidden one.
- A tab the user closed is simply re-opened on the next turn; the meta is updated by the mode.
