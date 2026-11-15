# TabPopupHandler

`core/browser/tab-view/TabPopupHandler.js`

Decides what a page's window.open or link-to-new-window becomes.

## Methods

- `new TabPopupHandler({ registry, createTab, gate })`; `gate` is a PopupGate (null allows every open).
- `wire(entry)` wires the gate and sets the webContents window-open handler:
  - refused by the gate (no user input in the last 5 s, site not allowed): denied and remembered on the tab.
  - disposition `new-window` (window.open with features) or a blank / `about:blank`
    URL: allowed as a real child window (menu bar auto-hidden, `webPreferences.sandbox` the same as its
    opener tab's, from `_popupWindowOptions(entry)`), inheriting the opener's session and requested size.
  - anything else: denied and opened as a strip tab right after the opener, in the
    opener's partition, with `openerTabId` set; `background-tab` (ctrl/cmd-click)
    does not take focus.

- `openBlocked(tabId, index)` opens one blocked open as a tab after the opener.
- `allowSite(tabId)` allows pop-ups for the tab's origin and opens what was blocked as background tabs;
  returns `{ success, opened }`.

## Why

Without a real window, `window.open()` returns null and the open-then-assign
pattern (`w = window.open(); w.location = url`), OAuth flows, print dialogs and
postMessage popups break. Plain link opens belong in the strip.

Since Electron 45 a `window.open()` child whose sandbox state differs from its opener's process is created in a
process of its own with no opener: `window.open()` returns null and `window.opener` is null in the child, which
breaks sign-in popups. Web tabs are sandboxed and the app's internal tabs are not (see
[TabViewFactory](TabViewFactory.md)), so `_popupWindowOptions(entry)` reads the opener's
`webContents.getLastWebPreferences()` and returns `{ autoHideMenuBar: true, webPreferences: { sandbox } }` with
`sandbox` false only when the opener's is explicitly false (true when the preferences cannot be read). The child then
shares the opener's process.
