# ShareLinkPublisher

`core/network-sharing/host/ShareLinkPublisher.js`

Publishes public read-only share links for conversations and artifacts. Links
are anonymous URLs on the web backend, so they exist only while sharing is on,
the web backend is on and its listener runs.

## Methods

- `new ShareLinkPublisher({ host, shares })`: `host` provides `isEnabled`,
  `isWebEnabled`, `isWebRunning`, `getWebPort`, `getWebPublicUrl`; `shares` is a [ShareStore](../ShareStore.md).
- `status()`: `{ available, reason, baseUrl }`; the reason names the first
  missing condition (sharing off, web backend off, listener not running).
- `create({ kind, targetId, title })`: `{ success: true, url:
  <baseUrl>/share/<token>, shareId }`, or `{ success: false, error }` with the
  status reason or the store's validation message. Re-sharing a target reuses its link.
- `resolve(token)`: the share entry, or null whenever sharing or the web
  backend toggle is off, so flipping either kills every published link at once.
- `baseUrl()`: the public URL override, else `http://<LanAddress.pick()>` plus
  `:<port>` unless the port is 80.
