# TabTerminal

`ui/shell/terminal/TabTerminal.js`

One tab's docked terminal: its own element in the dock's stage, its [TerminalView](../../terminal/TerminalView.md),
its [DockTransport](DockTransport.md) and its session. [TerminalDock](TerminalDock.md) shows it while its tab is in
front and keeps it running, hidden, while another tab is. The session is opened with `besideTabId` set to its tab.

`open` is whether the user wants it shown when its tab is in front. `hooks.onSession(session)` fires when its session
changes; `hooks.onEnded()` when its shell ended cleanly or its session was closed.

## Methods

- `new TabTerminal({ tabId, ipc, doc, parent, hooks })`, `start(xterm, settings, profileId)`, getter `sessionId`,
  `session`, `open`.
- `setVisible(visible)`, `focus()`, `end({ closeSession })`.
