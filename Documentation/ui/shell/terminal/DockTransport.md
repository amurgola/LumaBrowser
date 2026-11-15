# DockTransport

`ui/shell/terminal/DockTransport.js`

A [TerminalView](../../terminal/TerminalView.md)'s line to one terminal session from the window chrome, over
`window.ipcBridge`. Unlike a terminal tab's page, the chrome names its session by id and learns that id from the reply
that starts it, so while a join is under way every event is kept and the ones that turn out to be this session's are
delivered after it.

## Methods

- `new DockTransport(ipc, { profileId, cwd, besideTabId })`, getter `sessionId`.
- `attach(size)`, `restart(size)`, `input(data)`, `resize(cols, rows)`, `ack(chars)`, `onEvent(listener)`, `dispose()`.
