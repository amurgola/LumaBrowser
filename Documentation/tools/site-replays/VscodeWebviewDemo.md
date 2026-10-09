# VscodeWebviewDemo

`tools/site-replays/VscodeWebviewDemo.js`

An [IdeWebviewDemo](IdeWebviewDemo.md) that assembles the page the way the VS Code extension does, which is what it
tests: `ide/vscode/src/WebviewHtml.js` turning the placeholders into external scripts under a nonce-only CSP (a page
that needed an inline script would come up blank and show CSP errors), `resources/host.js` carrying the host contract
over the webview message channel (`acquireVsCodeApi` stubbed to record what it is sent), and `resources/vscode.css`
fed with Dark+ or Light+ `--vscode-*` variables. A local HTTP server on 127.0.0.1 serves the page; the page files are
written by [IdeWebviewFiles](../ide/IdeWebviewFiles.md) `syncPage` into `<out>/media`, the rest comes from `ide/vscode`.
Thin entry: `scripts/vscode-webview-demo.js [--light] [--out dir]` (default `tmp/vscode-webview`).

## Methods

- `new VscodeWebviewDemo(root, { log, error })`; `execute(args)` (from the base).
- `verify({ sent, probe })`: the shared message check, `ready` first (host.js loads before app.js), the prompt text
  survived the channel, `data-light` matches `--light`, the Segoe font reached the page, no page problems.
- `fileFor(urlPath)`: the file a request maps to, or `null` outside the two served folders.
- `pageState(over)`: `ideName` "Visual Studio Code". Constants: `DARK`, `LIGHT`, `NONCE`, `MIME`, `WEBVIEW_ENVIRONMENT`
  (an arrow function because Playwright ships its source text into the page).
