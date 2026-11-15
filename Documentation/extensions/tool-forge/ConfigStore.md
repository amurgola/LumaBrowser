# ConfigStore

`extensions/tool-forge/ConfigStore.js`

Per-tool config values (API keys etc.) under one settings key per tool,
`toolForge.config.<name>`. Secret slots are sealed by the
[OsKeychain](../../core/shared/OsKeychain.md) when it is available. Config is
never baked into code; it is resolved at call time. The keychain is asynchronous,
so `open()` decrypts every tool's values once at startup; reads then answer from
memory, and a change updates memory at once while its stored record follows to
the database, in order.

## Methods

- `new ConfigStore(rawDb, keychain = new OsKeychain(), log = console)`: `rawDb`
  is `context.db.getRawDb()` (`get`, `set`, `getAllKeysWithPrefix`); `log`
  reports a value that could not be stored.
- `open()` asks the keychain whether it can encrypt and decrypts every tool's
  stored values into memory. Run once, before the first `resolve`
  (`ToolForgeExtension.activate`).
- `idle()` resolves once every change so far is in the database
  (`ToolForgeExtension.deactivate`).
- `encryptionAvailable()`: what the keychain's `ready()` answered.
- `setValues(toolName, values, slots)`: memory changes at once; the stored record
  follows with secret slots as `{ enc: base64 }` when encryption is available,
  plain otherwise. An empty or null value deletes the slot. Slots the call did not
  touch keep their stored form. Returns `status(...)`.
- `resolve(toolName)`: `{ key: plaintext }` from memory; before `open()`, only the
  values stored in plain text.
- `status(toolName, slots)`: `{ encryptionAvailable, slots: [{ key, label,
  secret, required, configured }], missingRequired }`. Never values.
- `clear(toolName)`.
- `ConfigStore.KEY_PREFIX` (`'toolForge.config.'`).

A sealed value this account cannot open (the keychain changed) reads as unset and
is kept in the database until that slot is replaced. Writes run through a
`FileMutationQueue`; a failed write is logged, not thrown.
