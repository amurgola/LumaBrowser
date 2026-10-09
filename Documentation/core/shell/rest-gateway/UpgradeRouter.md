# UpgradeRouter

`core/shell/rest-gateway/UpgradeRouter.js`

Routes raw WebSocket upgrade requests to the extension that registered their path.

## Methods

- `new UpgradeRouter({ isDisabled = () => false })`.
- `register(extensionId, suffix, handler)` returns the prefix
  `/api/ext/<extensionId><suffix>`. The handler receives `(req, socket, head)`
  and must finish the handshake itself (usually `ws`'s `handleUpgrade`) or
  destroy the socket.
- `removeExtension(extensionId)` drops every handler that extension registered.
- `dispatch(req, socket, head)` calls the first handler whose prefix equals the
  path (query string ignored) or is a path-boundary parent of it. Unmatched,
  disabled, or throwing: the socket is destroyed.
- `UpgradeRouter.prefixFor(extensionId, suffix)`.

## Why

Upgrade requests bypass Express entirely, so nothing else would ever answer or
close them. Destroying unclaimed sockets mirrors the 503 the HTTP gate returns.
The single `upgrade` listener reads the map live, so registration works before
or after the server starts.
