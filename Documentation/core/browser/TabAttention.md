# TabAttention

`core/browser/TabAttention.js`

Puts one tab in front of the user when something on it is ready for them: the end of a
[click_until](tab-manager/RepeatClicker.md) loop that asked for `alert`.

## Methods

- `new TabAttention(tabViewManager, { notify })`: `notify({ title, body, onClick })` defaults to an Electron
  `Notification` (a no-op where Electron is not available, as in unit tests).
- `alert(tabId, { title, body })` -> true when the tab's window was raised. In order:
  1. the tab is shown (`switchToTab`; a silent tab has no place in the strip and stays where it is);
  2. its window is raised with [WindowRaiser](WindowRaiser.md): the window of a detached tab
     (`windowOfTab`), else the main window;
  3. the taskbar entry flashes until the window has focus, for the case where Windows refuses the foreground to a
     background app;
  4. a desktop notification is posted (body folded to one line, at most `MAX_BODY` 200 characters); clicking it
     shows the tab and raises the window again.

Every part is best effort: a closed tab, a missing window or a platform without notifications never throws.
