# TerminalTabContext

`core/terminal/TerminalTabContext.js`

The browser tab a docked terminal belongs to, as a program in that terminal should be told about it. A docked terminal
is opened under one tab and stays that tab's (the dock shows it only there), so `for(tabId)` is simply that tab:
`{ id, title, url }`, or null once it is gone.

[TerminalService](TerminalService.md) `tabBeside(sessionId)` uses it, and the code-mode bridge turns the answer into
the context and the working tab of a `luma` session (`extensions/code-mode/terminal/BrowserTabContext`).

## Methods

- `new TerminalTabContext({ getTabViewManager })`, `for(tabId)`.
