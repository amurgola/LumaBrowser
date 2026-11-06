# VaultStore

`core/vault/VaultStore.js`

The vault's items in the settings db under `core.vault.data` as one sealed record (`{ v, enc }` or `{ v, plain }`),
decrypted into memory on first use. It holds logins (`{ id, type: 'login', origin, username, password, title, notes }`)
and address / contact profiles (`{ id, type: 'profile', title, ...AutofillFields.KEYS }`), each with `createdAt`,
`updatedAt`, `lastUsedAt` and `timesUsed`. `FIELDS` lists what each type keeps.

A vault this account cannot open (copied from another machine or account) reads as empty with `unreadable: true`, and
every write throws instead of overwriting it.

## Methods

- `new VaultStore(db, { cipher, now })`.
- `status()` -> `{ encrypted, unreadable, count }`.
- `all()`, `get(id)` (copies), `findLogin(origin, username)`.
- `loginsFor(url)` the logins matching a page ([VaultSites](VaultSites.md)), exact before related, most recently
  used first, each with `match`.
- `add(fields)`, `addMany(list)`, `update(id, patch)` (id and createdAt are kept), `remove(id)`, `recordUse(id)`.

## Assistant access

Every item carries `aiAccess` ("Let the assistant use this"), false unless the user turned it on.

## Keys and two-factor

Type `key` (`{ title, value, notes }`: `title` names its `{{vault:<slug>}}` placeholder, `VaultStore.slug(title)`), and logins carry an optional `totp` secret.
