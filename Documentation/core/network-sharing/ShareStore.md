# ShareStore

`core/network-sharing/ShareStore.js`

Public share links: an unguessable token that grants read-only access to
exactly one conversation or artifact. Stored under `core.sharing.shareLinks`.

## Methods

- `new ShareStore(db)`.
- `list()` returns the management view: `{ id, kind, targetId, title,
  createdAt, revoked, tokenPreview }` (8 visible token chars).
- `issueOrGet({ kind, targetId, title })` returns the existing live share for
  that target, refreshing its title, or mints a new one. Returns the full entry
  (token included). Throws on an unknown kind or empty target.
- `resolve(token)` exact-match lookup of a live share, or null. Read-only.
- `revoke(id)`, `revokeAll()` (inherited).
- `removeForTarget(kind, targetId)` drops every share of a deleted target.
- `ShareStore.generateToken()` returns 32 lowercase hex chars.
- `ShareStore.TOKEN_PATTERN` (`/^[a-f0-9]{32}$/`), `ShareStore.KINDS`
  (`conversation`, `artifact`), `ShareStore.STORAGE_KEY`.

## Why

There is no PIN and no device binding: the token is the credential. It stays
high-entropy, and the share routes whitelist on `TOKEN_PATTERN` before
touching the store, so no other path shape can reach share data. Re-sharing
the same target keeps one stable URL; re-sharing after a revoke mints a new
token so the old URL stays dead. Titles are capped at 200 characters.
