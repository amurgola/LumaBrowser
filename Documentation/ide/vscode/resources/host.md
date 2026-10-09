# host.js

`ide/vscode/resources/host.js`

The VS Code side of the shared page's two-function host contract, loaded before the tool grammar and `app.js`:
`window.__lumaSend(json)` posts to the extension through `acquireVsCodeApi().postMessage`, and webview messages
are handed to `window.__luma.dispatch`. It also mirrors VS Code's light/high-contrast-light body classes onto
`data-light`. A classic script (one self-contained file, allowed exception like a sandboxed preload): the webview
loads it by nonce'd `<script src>` (see [WebviewHtml](../src/WebviewHtml.md)).

## Globals

Writes `window.__lumaSend`; reads `window.__luma`, `acquireVsCodeApi`, `document.body.classList`.
