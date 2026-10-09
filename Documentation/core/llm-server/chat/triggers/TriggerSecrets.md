# TriggerSecrets

`core/llm-server/chat/triggers/TriggerSecrets.js`

One signing secret per trigger, encrypted at rest when the OS keychain is available.

## Methods

- `new TriggerSecrets(settingsDb, crypto?)`: `settingsDb` needs `get(key,
  fallback)` and `set(key, value)`, and optionally `delete(key)`. `crypto` defaults
  to Electron `safeStorage` (required lazily so plain-Node tests load the file).
- `encryptionAvailable()`: whether the keychain can encrypt; a throwing check is `false`.
- `has(id)`: whether a secret is stored.
- `get(id)`: the plaintext secret, or `null` (also when decryption fails).
- `set(id, value)` returns `{ set, encrypted }`. An empty or nullish value deletes.
- `delete(id)` uses `db.delete`, else writes `null`. Best-effort.
- `TriggerSecrets.KEY_PREFIX` is `core.triggers.secret.`.

## Why

Holds the Slack signing secret, the GitHub webhook secret or a shared header
token. Stored under `core.triggers.secret.<id>` as `{ enc: base64 }`, or
`{ plain: value }` without a keychain (the same approach as Tool Forge's
ConfigStore). Values never ride a trigger row, an event or a run.
