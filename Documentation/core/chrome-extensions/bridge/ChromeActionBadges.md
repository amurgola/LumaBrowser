# ChromeActionBadges

`core/chrome-extensions/bridge/ChromeActionBadges.js` (main process)

The toolbar badges extensions set with `chrome.action.setBadgeText` and
`setBadgeBackgroundColor` (`chrome.browserAction` in Manifest V2). Electron
accepts those calls and drops them, so Bitwarden's count of logins for the
page never showed. One instance, owned by [ShimBridge](ShimBridge.md).

## Methods

- `new ChromeActionBadges({ activeTabs })`: `activeTabs()` returns
  `[{ window, tabId }]`, one per browser window
  ([ChromeTabs.activeTabs](ChromeTabs.md)).
- `setText(extId, { text, tabId })`, `setColor(extId, { color, tabId })`: with
  a `tabId` the value is that tab's own; without, it is the value for every
  tab. An unset `text` or `color` removes the entry, so a tab falls back to
  the value for every tab. An empty text is a value: that tab shows no badge.
- `badgesFor(tabId)`: `{ extId: { text, color } }` for the extensions that
  show a badge on the tab; a tab's own value wins. `color` is a CSS color or
  `null` for the toolbar's default.
- `badgesForWindow(window)`: the same for the tab a browser window is
  showing; a toolbar that has just loaded asks for it over
  `core.chromeExtensions.badges`.
- `clearTab(tabId)`: drops a tab's own values. ShimBridge calls it when the
  tab loads a new document or closes, which is when Chrome resets them.
- `forgetExtension(extId)`: a removed or disabled extension.
- `publish(tabId)`: sends `chrome-extensions:badges` with `badgesFor(...)` to
  the windows showing `tabId`, or to every window when no tab is named (a tab
  switch, a value for every tab). Every setter publishes.
- `ChromeActionBadges.cssColor(color)`: a CSS string as given, Chrome's
  `[r, g, b, a]` (0 to 255 each) as `rgba(...)`, anything else `undefined`.

The toolbar side is
[ChromeExtensionButtons](../../../ui/shell/nav/ChromeExtensionButtons.md).
Icons an extension swaps at run time (`setIcon`) are not handled.
