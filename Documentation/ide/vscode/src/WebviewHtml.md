# WebviewHtml

`ide/vscode/src/WebviewHtml.js`

Assembles `ide/webview/index.html` for a webview: the placeholders become CSP-safe `<link>` and nonce'd `<script src>` tags (host.js first).

## Methods

- `WebviewHtml.build(template, { uri, nonce, cspSource })`: throws when a placeholder is missing.
- `WebviewHtml.csp(nonce, cspSource)`, `WebviewHtml.makeNonce()`, `WebviewHtml.PLACEHOLDERS`
  (`CSS`, `SHARED_TOOL_GRAMMAR`, `APP_JS`).
