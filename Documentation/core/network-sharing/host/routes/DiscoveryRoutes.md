# DiscoveryRoutes

`core/network-sharing/host/routes/DiscoveryRoutes.js`

`/sharing` discovery and pairing routes. Routing only.

## Methods

- `new DiscoveryRoutes(service, auth)`; `mount(router)` adds:
  - `GET /info` (no auth): `service.getInfo()`.
  - `POST /pair` (`requireEnabled`): the body's `apiKey` or `pin` (the PIN
    field also takes a user's access key, so the desktop client signs in with
    one unchanged) goes to `service.pair(secret, { ip:
    IpClass.clientIp(req), peerHint })` answered by `PinPairing.toReply`
    (200 `{ token, name }`, 401, or 429 with `retryAfterMs`).
  - `GET /resources` (`requireToken`): `service.buildManifest(req.sharingToken)`.
