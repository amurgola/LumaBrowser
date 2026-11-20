# WindowRaiser

`core/browser/WindowRaiser.js`

Brings a window to the front. Used by [TabAttention](TabAttention.md) and by the desktop integration's
[AppWindows](../../extensions/desktop-integration/shared/AppWindows.md) and
[ChatHandoff](../../extensions/desktop-integration/shared/ChatHandoff.md).

## Methods

- `WindowRaiser.raise(win)` -> true when the window exists and was raised; false for no window, a destroyed one or
  one that throws. Restore comes before show (minimize-to-tray hides the window in the middle of a minimize). On
  Windows a background process may not take the foreground, so the window is topmost for the moment it takes focus;
  elsewhere it is shown and focused.
