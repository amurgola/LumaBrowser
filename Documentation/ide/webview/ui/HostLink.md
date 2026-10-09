# HostLink

`ide/webview/ui/HostLink.js`

The page's way out to its IDE host, through `window.__lumaSend(json)`.

## Methods

- `new HostLink(win)`; `send(type, payload)` posts `{ type, payload }` as JSON, silently dropped while the host has
  not injected `__lumaSend` yet.

## Globals

Reads `win.__lumaSend`.
