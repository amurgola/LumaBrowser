# SharingUsers

`core/network-sharing/host/SharingUsers.js`

The host's named sharing users behind [SharingHostService](SharingHostService.md):
create, rename, override permissions, rotate keys, remove, build login links,
and turn an access key into the request credential the `/sharing` routes carry.

## Methods

- `new SharingUsers({ users, usage, allowList, baseUrl })`: `users` is
  [UserStore](../UserStore.md), `usage` is [UsageStore](../UsageStore.md),
  `allowList` is [WebToolAllowList](WebToolAllowList.md) (its `clean`), and
  `baseUrl()` is the web backend's base URL
  ([ShareLinkPublisher](ShareLinkPublisher.md) `baseUrl`).
- `list()`: users with their usage counters.
- `create({ name, kind })`: `{ success, user, key, loginUrl }`.
- `update(id, fields)`, `setOverrides(id, overrides)`: `{ success, user }` or
  `{ success: false, error }`. Tool names the catalog does not know are dropped.
- `rotateKey(id)`: `{ success, user, key, loginUrl }`; the old key stops working.
- `remove(id)`: removes the user and its usage counters.
- `loginLink(id)`: `{ success, key, loginUrl }`. The link is
  `<base>/?apiKey=<key>`, which the web app's
  [PairingGate](../webapp/public/js/web/PairingGate.md) signs in with.
- `credentialFor(key)`: `{ id, label, peerHint, kind, viaUser: true,
  overrides }` for a live key, or null.
- `signIn(key)`: `{ success, token, user }` where the token is the key itself,
  or `{ success: false, error: 'Unknown or disabled access key.' }`.

## Why

The key is the bearer token after sign-in, so nothing new is stored on the
client, and a rotated or removed user is locked out on the next request. Wrong
keys do not feed the PIN lockout ([PairingThrottle](PairingThrottle.md)): a key
cannot be guessed, and a stranger trying keys should not lock out PIN pairing.
