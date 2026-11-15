# DockedTabs

`extensions/code-mode/turn/DockedTabs.js`

The browser tab a Code conversation is working beside, per conversation, while its client (the luma CLI) runs in a
terminal docked under that tab. [TerminalSession](../terminal/TerminalSession.md) sets it at the start of every turn
(the page in front, else the tab the terminal was opened under, else nothing) and
[CodeTurnBuilder](CodeTurnBuilder.md) reads it: a docked turn gets the browser tools with that tab as its working tab.
One instance is shared by the mode and the terminal bridge (`CodeModeExtension`). In memory only.

## Methods

- `set(conversationId, tabId)` (null clears), `get(conversationId)` -> tab id or null.

The tab is the one the terminal is docked under ([BrowserTabContext](../terminal/BrowserTabContext.md) `tabFor`), or nothing once that tab is closed.
