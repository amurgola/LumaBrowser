# BrowserTabContext

`extensions/code-mode/terminal/BrowserTabContext.js`

Which browser tab a `luma` session was started under, so "this page" means that tab without the developer saying so,
and "go to reddit.com" navigates it.

1. A terminal inside LumaBrowser sets `LUMA_TERMINAL` (its session id).
2. The CLI sends it in `hello` as `terminal` (`cli/lib/connect/HostTerminal`).
3. [TerminalSession](TerminalSession.md) keeps it when it is a well-formed id, and at the start of every turn asks the
   app's terminal service (`global.__lumaTerminal.tabBeside(id)`) for the tab that terminal is docked under.
4. That tab rides the turn's model message as a block, after any editor context (the stored user message stays what
   the developer typed), and is handed to [DockedTabs](../turn/DockedTabs.md) as the turn's **working tab**, which is
   what gives a docked Code turn the browser tools on it.

```
<browser_context>
The developer is working in a terminal docked under a browser tab in LumaBrowser, and that tab is your working tab...
<tab role="working-tab" tabId="7" title="..." url="..." />
</browser_context>
```

Nothing is added, and the turn stays browser-free, for a session that is not in a docked terminal (a terminal tab, an
ordinary terminal outside the app) or whose tab has been closed.

## Methods

- Statics: `terminalId(value)`, `tabFor(terminalId, terminal)` -> `{ id, title, url }` or null, `render(tab)`.
