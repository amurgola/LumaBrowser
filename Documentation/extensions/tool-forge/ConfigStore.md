# ConfigStore

`extensions/tool-forge/ConfigStore.js`

Per-tool config values (API keys etc.) under one settings key per tool,
`toolForge.config.<name>`. Config is never baked into code; it is resolved at
call time.

## Methods

- `new ConfigStore(rawDb, crypto)`: `crypto` is
  `{ isEncryptionAvailable, encryptString, decryptString }`, default Electron
  `safeStorage` (required lazily, so plain-Node tests load this).
- `encryptionAvailable()`: false when the keychain is unavailable or throws.
- `setValues(toolName, values, slots)`: secret slots are stored
  `{ enc: base64 }` when encryption is available, plain otherwise; an empty or
  null value deletes the slot. Returns `status(...)`.
- `resolve(toolName)`: `{ key: plaintext }`; an undecryptable value (the
  keychain changed) and non-string values read as unset.
- `status(toolName, slots)`: `{ encryptionAvailable, slots: [{ key, label,
  secret, required, configured }], missingRequired }`. Never values.
- `clear(toolName)`.
- `ConfigStore.KEY_PREFIX` (`'toolForge.config.'`).
