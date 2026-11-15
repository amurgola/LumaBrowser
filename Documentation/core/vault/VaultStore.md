# VaultStore

`core/vault/VaultStore.js`

The vault's items in the settings db under `core.vault.data` as one sealed record (`{ v, enc }` or `{ v, plain }`,
sealed by [OsKeychain](../shared/OsKeychain.md)), held decrypted in memory while the app runs. It holds logins
(`{ id, type: 'login', origin, username, password, title, notes }`) and address / contact profiles
(`{ id, type: 'profile', title, ...AutofillFields.KEYS }`), each with `createdAt`, `updatedAt`, `lastUsedAt` and
`timesUsed`. `FIELDS` lists what each type keeps.

A vault this account cannot open (copied from another machine or account) reads as empty with `unreadable: true`, and
every write throws instead of overwriting it.

## Loading and saving

The keychain is asynchronous, so `open()` decrypts the stored record once at startup (ReadyPhase's
`_openSecretStores`). Reads then answer synchronously from memory. A change updates memory at once and its sealed
record follows to the database through a `FileMutationQueue`, one write after another, in order; a failed write is
logged, not thrown. When `open()` finds the OS rotated its key, the record is sealed again.

A vault with no stored record, or a plain one, loads on first use without `open()`. A sealed one reads as empty and
refuses writes ("still being opened") until `open()` has run, so a list that lacks its items never replaces it.

## Methods

- `new VaultStore(db, { cipher, now, log })`: `cipher` an OsKeychain (default a new one), `log` reports a change that
  could not be stored.
- `open()` asks the keychain whether it can encrypt and decrypts the stored record; resolves `status()`.
- `idle()` resolves once every change so far is in the database (ShutdownSequence waits on it).
- `status()` -> `{ encrypted, unreadable, count }`.
- `all()`, `get(id)` (copies), `findLogin(origin, username)`.
- `loginsFor(url)` the logins matching a page ([VaultSites](VaultSites.md)), exact before related, most recently
  used first, each with `match`.
- `add(fields)`, `addMany(list)`, `update(id, patch)` (id and createdAt are kept), `remove(id)`, `recordUse(id)`.

## Assistant access

Every item carries `aiAccess` ("Let the assistant use this"), false unless the user turned it on.

## Keys and two-factor

Type `key` (`{ title, value, notes }`: `title` names its `{{vault:<slug>}}` placeholder, `VaultStore.slug(title)`), and logins carry an optional `totp` secret.
