# LumaViewProvider

`ide/vscode/src/LumaViewProvider.js`

The Luma webview view: hosts the shared page and relays between it and the session in LumaWebView.kt's vocabulary. Messages to the page wait for its `ready`.

## Methods

- `new LumaViewProvider(extensionUri, session, fileSync, log)`; `resolveWebviewView(view)`, `html(webview)`,
  `dispatch(msg)`, `pushState()`, `reveal(focusInput)`, `handle(msg)`, `visible`. `LumaViewProvider.VIEW_ID` = `luma.chat`.
- Start/Reconnect lead out of Restricted Mode first, then to the folder picker; `openUrl` only for http(s).
