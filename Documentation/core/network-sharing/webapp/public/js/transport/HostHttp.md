# HostHttp

`core/network-sharing/webapp/public/js/transport/HostHttp.js`

Same-origin fetch to `/sharing` with the pairing bearer, and the shared 401 check.

## Methods

- `new HostHttp({ fetch, token, win })`: `token` is a [PairingToken](PairingToken.md).
- `headers(extra)`: a copy of `extra` plus `Authorization: Bearer <token>` when paired.
- `fetch(input, init)`: unauthenticated (discovery, pairing).
- `authed(input, init)`: `init.headers` gain the bearer.
- `throwIfUnauthorized(res)`: throws [Unauthorized](Unauthorized.md) on a 401.
- `unauthorized(message)`: a new Unauthorized for this window.
