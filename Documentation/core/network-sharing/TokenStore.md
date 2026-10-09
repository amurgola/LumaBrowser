# TokenStore

`core/network-sharing/TokenStore.js`

Per-client bearer tokens issued after a successful PIN pairing. Stored under
`core.sharing.tokens`.

## Methods

- `new TokenStore(db)`.
- `list()` returns the host UI view: `{ id, label, peerHint, createdAt,
  lastUsedAt, revoked, tokenPreview }` (14 visible token chars).
- `issue({ label, peerHint })` mints and stores an entry, returning it with
  the full token. Label defaults to `Paired client`; label and hint are capped
  at 120 characters.
- `verify(token)` returns the live entry for the token and stamps
  `lastUsedAt`, or null.
- `revoke(id)`, `revokeAll()` (inherited); `remove(id)` deletes one entry.
- `TokenStore.generateToken()` returns `lumapeer_` plus 64 hex chars.
- `TokenStore.STORAGE_KEY`, `TokenStore.TOKEN_PREFIX`.

## Why

Rotating the PIN does not invalidate tokens, so a paired client keeps working.
`revokeAll` is the explicit reset.
