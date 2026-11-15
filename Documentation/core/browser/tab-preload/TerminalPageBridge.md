# TerminalPageBridge

`core/browser/tab-preload/TerminalPageBridge.js`

Exposes `window.lumaTerminal` through contextBridge, only when the page is `luma://terminal`. Installed by TabPreload,
so a terminal tab runs in Chromium's sandbox with the same preload as every tab and comes back working after a
restart. Main also checks the sender ([TerminalIpcHandlers](../../terminal/TerminalIpcHandlers.md)).

None of the calls carries a session id: main decides which session is the page's.

`attach(size)`, `restart(size)`, `hold(held)`, `settings()`, `input(data)`, `resize(cols, rows)`, `ack(chars)`,
`closeTab()`, `onEvent(listener)`.

## Methods

- `TerminalPageBridge.install(contextBridge, ipcRenderer, window)` -> whether it exposed the bridge.
