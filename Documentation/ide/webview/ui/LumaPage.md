# LumaPage

`ide/webview/ui/LumaPage.js`

The IDE chat page shared by the JetBrains plugin (JCEF) and the VS Code extension (webview): a DOM port of the
`luma` terminal session that renders the same terminal-bridge frames with the same tool grammar. It owns the page
state and wires the parts below together; the socket, the editor and the files stay on the host side.

## Methods

- `new LumaPage(grammar, win = window)`: `grammar` is the CLI's ToolGrammar (`window.LumaToolGrammar`). Collects
  the page elements by id and builds Transcript, AnswerStream, ContextChips, Composer, ApprovalBar, HeroCard,
  PageChrome and FrameRouter. Public fields: `grammar`, `el`, `state` (PageState), `host` (HostLink) and the parts.
- `start()`: paints the icons and chrome, sets `window.__luma = { dispatch }`, adds the window Escape handler and
  sends `ready` to the host.
- `dispatch(msg)`: one host message by `kind`: `frame` (to FrameRouter), `state` (merged into PageState), `theme`,
  `reset`, `focus`, `insertText`, `send` (fill the box and submit), `note`, `abort`.
- `submit()`: sends the box's text as `prompt { text, context }` with the attached chips, or as `followup` while a
  turn is streaming; offline it flashes "LumaBrowser is not connected."
- `abort()`, `beginTurn(text, context)`, `endTurn()` (sends `turnEnded`), `newToolBlock(tool, params)`.

## Host contract

Page to host: `window.__lumaSend(json)` with `{ type, payload }`: `ready`, `prompt`, `followup`, `approve`, `abort`, `removeContext`, `openFile`, `showDiff`, `insert`, `copy`, `start`, `reconnect`, `settings`, `turnEnded`. Host to page: `window.__luma.dispatch(message)`.

## Globals

Writes `window.__luma`; reads `window.__lumaSend` (through HostLink), `window.LumaToolGrammar` (passed in by
entry.js), `document`, `requestAnimationFrame`.
