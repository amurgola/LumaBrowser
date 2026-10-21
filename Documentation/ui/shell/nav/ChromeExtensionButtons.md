# ChromeExtensionButtons

`ui/shell/nav/ChromeExtensionButtons.js`

The toolbar buttons for installed Chrome extensions, in `#chromeExtButtons`
right after the bookmark star, as in Chrome.

## Behaviour

- One `.icon-btn.chrome-ext-btn` per extension that is enabled and has a popup
  page, showing the extension's icon (the `icon` data URL from
  `core.chromeExtensions.list`) or its initial when it ships none. The
  container is hidden when there are none.
- A click calls `core.chromeExtensions.openPage(id, 'popup', { x, y })` with the
  button's bottom right corner (plus `POPUP_GAP`) in window coordinates, so
  [ChromeExtensionPageWindows](../../../core/chrome-extensions/ChromeExtensionPageWindows.md)
  hangs the popup under the button. Clicking again while it is open closes it.
- Rebuilt from the `chrome-extensions:changed` document event that the Settings
  Chrome Extensions panel dispatches with the fresh list after every render
  (install, update, enable, disable, remove), and refreshed on window focus.
  An unchanged list does no DOM work.

## Methods

- `install()` finds the container, subscribes and loads the list.
- `refresh()` re-reads the list over IPC.
- `ChromeExtensionButtons.withPopup(extensions)` the subset that gets a button.

Built and installed by `ShellApp` next to `BookmarkStar`. Styles live in
`ui/shell/css/icon-buttons.css`.

## Right-click menu

`contextmenu` on a button cancels the native menu (which only offered Select
All) and opens the shell `PopupMenu` under the button: Open, Options (when the
extension has an options page), Disable, Remove from LumaBrowser (after a
`Dialogs.confirm`), and Manage extensions, which opens Settings > Extensions >
Chrome Extensions through `ShellApp._openChromeExtensionSettings`. Disable and
Remove refresh the buttons and dispatch `chrome-extensions:modified`, which
an open Chrome Extensions pane re-renders on.

Constructor: `new ChromeExtensionButtons({ el, popupMenu, openSettings })`.
`showMenu(ext, btn)` and `menuFor(ext, btn)` are public for tests.
