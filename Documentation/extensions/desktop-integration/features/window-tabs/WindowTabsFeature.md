# WindowTabsFeature

`extensions/desktop-integration/features/window-tabs/WindowTabsFeature.js`

Wires the [window-tabs](index.md) feature: the shortcut and the hint key open a
window as a tab; the tab's page talks to this feature over IPC; the shared tab
session's display-media handler grants a page the capture of its own window;
REST lists, opens and closes.

## Settings

- `binding` (hotkey, `Ctrl+Alt+Shift+T`): opens the window in front as a tab,
  or shows its tab; on the shortcut hint it acts on the picked window.
- `control` (bool, on): the tab's Control switch may pass clicks, keys and
  scrolling through to the window. Uses desktop control (its gate applies).
  Also what lets a Tab Share interact guest's screen size resize the window.
- `textRefreshSec` (3..120, 10): how often an active tab re-reads the window's
  accessible text; a background tab reads every 45 s.
- `frameRate` (5..60, 30): the capture's frames per second.

## Methods

- `static defaultParts(deps)`: the real parts, Electron and Win32 required
  lazily: `globalShortcut` (the extension's shared backend), `probe`
  ([WindowProbe](../lumabyte/WindowProbe.md)), `context`
  ([WindowContext](../lumabyte/WindowContext.md), Windows only, for the text),
  `closeUia`, `getDesktop` (`global.__lumaDesktop`), `session` (the shared tab
  partition), `webContentsFromFrame`, `sourceFor(hwnd)` (the desktopCapturer
  window source whose id starts `window:<hwnd>:`), `icon(imagePath)`
  (`app.getFileIcon` as a data URL), `focusWindow`, `listWindows`, `imagePath`,
  `windowSizing` ([Win32Windows](../../../../core/desktop/win32/Win32Windows.md)
  for [WindowTabFit](WindowTabFit.md), null off Windows).
- `new WindowTabsFeature(deps, parts)`; `supported` (Windows, a probe and
  `deps.browser`); `start()` registers the shortcut, the page IPC, the capture
  handler and the hint key; `instance()` -> `{ mount, onSettingsChanged, dispose }`.
- `fire()`: the shortcut; while the hint is up it acts on the hint's target and
  dismisses the hint.
- `hintEntries({ framed, hwnd })` -> one entry `window-tabs.open` for the hint
  ([HintContributions](../../shared/HintContributions.md)): "Open as tab" with
  a note naming the app, "Show tab" when it already has one, disabled with the
  reason (Luma's own window, the shell, no window, not Windows).
- `open(hwnd, { via })`: the window (its root owner for a dialog) becomes a tab:
  `browser.createTab(pageUrl, { activate, title, preloadPath })`, the main
  window brought to the front, `opened` broadcast; an existing tab is switched
  to instead. `{ success, hwnd, tabId, created }` or `{ success: false, error, code }`
  (`DISABLED`, `UNSUPPORTED`, `NOT_FOUND`, `REFUSED`, `NO_BROWSER`).
- `close(hwnd)`, `list()` (entries whose tab the browser still has; tab ids
  learned from the open tabs' URLs), `pageUrl(hwnd, app)` (the page's file URL
  with `hwnd` and `app` (its exe) in the query), `describe()`, `mount(router)`,
  `applyBindings()`, `onSettingsChanged(key)`, `dispose()` (unregisters, puts
  back every window still sized for a guest, removes the display-media handler,
  closes UIA), `static statusFor(code)`.
- The page (IPC `ext.desktop-integration.window-tabs.page.*`, a caller that is
  not one of the feature's pages by URL gets `Not a window tab`):
  `state(page, { stage }, sender)` (`{ hwnd, alive, title, app: { name, exe }, minimized, visible, control: { allowed, reason }, textRefreshSec, frameRate }`;
  a page whose window is not registered, a tab restored after a restart, is
  adopted when the handle still belongs to the same program; `stage` is the
  page's picture area, see below), `text(page)`
  (the accessible text through WindowContext), `icon(page)`, `input` (through
  [WindowTabInput](WindowTabInput.md), only while the window is a tab),
  `restore` (brings a minimized window back), `windows()` (titled app windows
  for the picker: `{ hwnd, title, app, exe, open }`), `adopt(page, { hwnd }, sender)`
  (the page's tab becomes that window's: registered, then the sender navigates
  to its URL).
- The capture: `session.setDisplayMediaRequestHandler` on the shared tab
  partition; a request from one of the feature's pages whose window is a live
  tab gets `{ video: <that window's source> }`, anything else `{}` (denied, as
  with no handler). Removed on dispose.

## Following a Tab Share guest's size (2026-11-15)

An interact guest that presses Fit sizes the shared tab to its own window
([TabLayout](../../../../core/browser/tab-view/TabLayout.md)). For a window tab
that only resizes the page around the picture, so the window itself follows:
every `state` call carries the page's picture area (`stage`, DIP), and while the
sender's tab has a `viewSize` and input may pass through (`control` on and the
desktop control gate open) [WindowTabFit](WindowTabFit.md) sizes the window's
visible frame to it. When the tab is no longer sized (that guest gave it back
or left, the share stopped or went view-only) the window goes back to how it sat. A window that
stops being a tab (closed, switched to another window in the picker, its tab
gone) is put back too. A page with no layout yet changes nothing.

## Why

Opening a window as a tab puts it where Luma's tab features already are: the
chat reads it like a page (its text is in the page), Tab Share streams it (a
`view` link watches, an `interact` link's clicks reach the window), and the
agent's browser tools see it. The page is a file URL in the shared partition
rather than a new tab kind so every "regular tab" consumer treats it as one.
