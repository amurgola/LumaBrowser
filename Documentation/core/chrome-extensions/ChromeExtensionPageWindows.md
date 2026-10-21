# ChromeExtensionPageWindows

`core/chrome-extensions/ChromeExtensionPageWindows.js`

Opens an installed extension's popup or options page in its own window.

## Methods

- `new ChromeExtensionPageWindows({ service, openUrlInTab, sessionProvider })`:
  `service` is [ChromeExtensionService](ChromeExtensionService.md);
  `openUrlInTab(url)` receives web links the page opens; `sessionProvider`
  defaults to the shared tab partition (`persist:main`).
- `open(id, kind)`: `kind` is `popup` or `options`. Loads every enabled
  extension into the tab session, then opens a sandboxed, context-isolated
  window on `chrome-extension://<id>/<page>`. Returns `{ reused: false }`, or
  focuses the open window for that extension and kind and returns
  `{ reused: true }`. Throws for an unknown kind, an unknown or disabled
  extension, or one without that page.
- `ChromeExtensionPageWindows.pageUrl(id, page)`.

## Window opens from the page

- The extension's own `chrome-extension://<id>/` pages are allowed (Bitwarden's
  "pop out").
- `http(s)` links go to `openUrlInTab` and the window is denied.
- Anything else is denied.

## Why

Electron draws no toolbar button for extensions, so a password manager could
never be unlocked. The window uses the tab session, not the default one: each
session holds its own instance of an extension with its own storage, and the
popup must share it with the content scripts running in tabs.

## Anchored toolbar popup

`open(id, 'popup', anchor)` with `anchor = { parent, x, y }` (a live
BrowserWindow and a point in its content coordinates, the toolbar button's
bottom right) opens the popup as Chrome does: a frameless, taskbar-less child
window whose right edge sits under the button, kept inside the display's work
area. `enablePreferredSizeMode` sizes it to the page, clamped to 25x25 through
800x600 (Chrome's limits), and it shows once the first size arrives (or on
`ready-to-show`). After a blur it closes as soon as another window of the app
takes focus; focus leaving the app altogether (a 2FA code in a phone or
desktop app) keeps it open, and refocusing the popup cancels the close. Open
DevTools keeps it open too. This follows electron-browser-shell's
`PopupView` (same clamp, same right-edge alignment); no code is shared. Because the
click on the button blurs the popup first, an anchored open within
`TOGGLE_GRACE_MS` of that blur-close returns `{ toggledClosed: true }` instead
of reopening, which makes the button a toggle. The anchored window is keyed
separately from the Settings one, which keeps the ordinary framed window.

## closeFor

`closeFor(id)` closes every page window (popup, anchored popup, options) of an
extension. The IPC handlers call it before removing or disabling it.
