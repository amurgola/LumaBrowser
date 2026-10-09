# TabPopupHandler

`core/browser/tab-view/TabPopupHandler.js`

Decides what a page's window.open or link-to-new-window becomes.

## Methods

- `new TabPopupHandler({ registry, createTab })`.
- `wire(entry)` sets the webContents window-open handler:
  - disposition `new-window` (window.open with features) or a blank / `about:blank`
    URL: allowed as a real child window (menu bar auto-hidden), inheriting the
    opener's session and requested size.
  - anything else: denied and opened as a strip tab right after the opener, in the
    opener's partition, with `openerTabId` set; `background-tab` (ctrl/cmd-click)
    does not take focus.

## Why

Without a real window, `window.open()` returns null and the open-then-assign
pattern (`w = window.open(); w.location = url`), OAuth flows, print dialogs and
postMessage popups break. Plain link opens belong in the strip.
