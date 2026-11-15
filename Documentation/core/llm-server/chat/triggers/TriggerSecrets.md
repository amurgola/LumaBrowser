# TriggerSecrets

`core/llm-server/chat/triggers/TriggerSecrets.js`

One secret per id (a trigger's Slack signing secret, GitHub webhook secret or
shared header token; the Personal Hub's API and OAuth tokens), sealed at rest by
the [OsKeychain](../../../shared/OsKeychain.md) when it is available. The
keychain is asynchronous, so `open()` decrypts every stored secret once at
startup; reads then answer from memory, and a change updates memory at once while
its sealed record follows to the database, in order.

## Methods

- `new TriggerSecrets(settingsDb, keychain = new OsKeychain(), log = console)`:
  `settingsDb` needs `get(key, fallback)`, `set(key, value)` and
  `getAllKeysWithPrefix(prefix)`, and optionally `delete(key)`. `log` reports a
  secret that could not be stored.
- `open()` asks the keychain whether it can encrypt and decrypts every stored
  secret (keys under `core.triggers.secret.`) into memory. A record this account
  cannot open is skipped; one whose key the OS rotated is sealed again. Run once,
  before the first `get`.
- `idle()` resolves once every change so far is in the database.
- `encryptionAvailable()`: what the keychain's `ready()` answered.
- `has(id)`: whether a secret is held (in memory, or a stored record).
- `get(id)`: the plaintext secret from memory, or `null`. Before `open()`, only a
  `{ plain }` record reads.
- `set(id, value)` returns `{ set, encrypted }`. Memory changes at once and the
  sealed record (`{ enc: base64 }`, or `{ plain: value }` without a keychain)
  follows. An empty or nullish value deletes.
- `delete(id)` forgets the secret at once, then uses `db.delete`, else writes
  `null`.
- `TriggerSecrets.KEY_PREFIX` is `core.triggers.secret.`.

Writes run through a `FileMutationQueue`, so a delete never overtakes the set
before it; a failed write is logged, not thrown.

## Why

Values never ride a trigger row, an event or a run. Two instances exist over the
same keys: the app's (opened by ReadyPhase's `_openSecretStores`, drained by
ShutdownSequence's `_storeSecrets`) for trigger secrets, and the Personal Hub's
for its tokens. An instance holds what was stored when it opened plus its own
changes, so it must only be asked for ids it wrote itself; the two use different
ids. Tool Forge's
[ConfigStore](../../../../extensions/tool-forge/ConfigStore.md) uses the same
approach.
