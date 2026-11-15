# TerminalDock

`ui/shell/terminal/TerminalDock.js`

The terminal dock: a panel under the page, the twin of the AI chat panel, holding the terminal of the tab in front.
The toolbar button (`#terminalDockToggle`) and Ctrl+backtick open and hide it.

**A docked terminal belongs to the tab it was opened under.** It shows while that tab is in front, steps aside (still
running) on any other tab, the LLM tab included, comes back when its tab does, and ends when its tab closes. Each tab
can have its own ([TabTerminal](TabTerminal.md)). That is what lets a CLI agent in it treat "this page" as one definite
page: the session's `LUMA_TAB_ID` never goes stale, and `luma` started there works on that tab.

- Only a web page can have one: not the LLM tab or the Dashboard, and not a tab that is itself a terminal.
- Hiding it (the close button, Ctrl+backtick) is remembered per tab and does not end the shell.
- The picker starts another profile (a shell or a CLI app) in place of the front tab's terminal.
- **Open in tab** hands the live session to a terminal tab and takes it out of the dock.
- A shell that ended cleanly leaves the dock; a failure stays up to be read.
- The dock learns which tab is in front and which closed from `tabEvents` (`window.tabAPI.onSwitched` / `onClosed`).
- The panel is in `ViewBoundsReporter.OVERLAY_SELECTORS` and `PanelResizer.PANELS`, so the page view makes room, the
  top edge drags, and the terminal and its shell are resized with it. The wheel scrolls the terminal's history.
- The terminal is drawn on the dock's own surface colour instead of the palette's page background.
- `keepsKey(event, action)`: inside the dock the shell owns unshifted chords (Ctrl+R, Ctrl+W, Escape...), except the
  dock's own, tab switching, zoom, fullscreen and devtools. `ChromeKeyboard` asks before running a shortcut.

## Methods

- `new TerminalDock({ ipc, store, loadXterm, tabEvents, doc })`, `install()`, `isOpen()`, `toggle()`, `show()`,
  `hide()`.
- Static `keepsKey(event, action)`.
