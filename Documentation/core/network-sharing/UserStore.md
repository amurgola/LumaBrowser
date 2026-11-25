# UserStore

`core/network-sharing/UserStore.js`

Named sharing users, each a person or a group, who sign in with their own
access key instead of the host PIN. Each user carries permission overrides on
top of the host's master sharing settings (see [AccessPolicy](host/AccessPolicy.md)).
Stored under `core.sharing.users`.

## Methods

- `new UserStore(db)`.
- `list()` returns the host UI view: `{ id, name, kind, createdAt, lastUsedAt,
  revoked, keyPreview, overrides }` (14 visible key chars, never the full key).
- `create({ name, kind })` mints and stores a user, returning the entry with
  its full key in `token`. A blank name becomes `Guest`; `kind` is `person`
  (the default) or `group`; names are capped at 80 characters.
- `verify(key)` returns the live entry for a key and stamps `lastUsedAt`, or
  null for an unknown, revoked or non-key value.
- `keyOf(id)` returns the full key, for the host's login-link button.
- `update(id, { name, kind })`, `setOverrides(id, overrides)` and
  `rotateKey(id)` return the public view, or null for an unknown id.
  `setOverrides` stores the [UserOverrides](host/UserOverrides.md) shape.
  `rotateKey` issues a new key and brings a revoked user back.
- `remove(id)` deletes one user; `revoke(id)`, `revokeAll()` are inherited from
  [RevocableEntryStore](RevocableEntryStore.md).
- `UserStore.generateKey()` returns `lumauser_` plus 64 hex chars.
- `UserStore.looksLikeKey(secret)` tells an access key from a PIN by its prefix.

## Why

The PIN pairs a device, and every paired device gets the same master
permissions. A user key names who is calling, so the host can hand a friend a
login link and give that friend (or a group of friends sharing one key) their
own models, tools and toggles. The key is a bearer secret like a pairing token:
it is 256 random bits, so guessing is not a concern, but anyone holding the
link signs in as that user.
