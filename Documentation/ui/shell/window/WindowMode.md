# WindowMode

`ui/shell/window/WindowMode.js`

Which kind of browser window the shell runs in. The main window carries the whole
app; a window a tab was dragged out into (`?window=detached`, opened by
[TabWindows](../../../app/window/TabWindows.md)) is a plain browser window.

## Methods

- `WindowMode.isDetached(search = location.search)`.
- `WindowMode.apply(body, detached)`: toggles `body.detached-window` (CSS hides the
  right dock, its resizer, the AI chat toggle and the dashboard button) and returns
  the mode.

[ShellApp](../app/ShellApp.md) skips the setup wizard, the slot manager and the
extension renderers in a detached window.
