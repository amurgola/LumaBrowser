# PairingToken

`core/network-sharing/webapp/public/js/transport/PairingToken.js`

The web client's pairing token and host name in `localStorage`
(`luma.web.token`, `luma.web.host`), with the token mirrored into the
same-origin cookie `luma_share_token` (`path=/`, one year, `SameSite=Strict`) so
artifact iframes and the agent-chat module scripts, which cannot send an
Authorization header, still authenticate to `/sharing`.

## Methods

- `new PairingToken({ storage, doc })`.
- `get()` (or `null`), `set(token)` (falsy clears storage and cookie),
  `hostName()` (or `''`), `setHostName(name)`, `syncCookie(token = get())`.
  Storage and cookie failures are swallowed (private mode).
