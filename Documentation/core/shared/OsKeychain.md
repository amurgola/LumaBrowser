# OsKeychain

`core/shared/OsKeychain.js`

The OS keychain as the app's secret stores use it, over Electron's asynchronous
`safeStorage` (DPAPI on Windows, the Keychain on macOS, the secret service on
Linux): text is sealed into a record that only this OS account can open. Whether
the keychain can encrypt is asked once and remembered, so a settings page can say
so without waiting. Used by [VaultStore](../vault/VaultStore.md),
[TriggerSecrets](../llm-server/chat/triggers/TriggerSecrets.md) and Tool Forge's
[ConfigStore](../../extensions/tool-forge/ConfigStore.md).

## Methods

- `new OsKeychain(safeStorage = null)`: `safeStorage` defaults to Electron's,
  required lazily so plain-Node tests load the file.
- `ready()` asks the OS once (`isAsyncEncryptionAvailable`) whether it can
  encrypt for this account; every later call returns the same promise. A missing
  method or a throwing check answers false.
- `available()` what `ready()` answered; false until it has.
- `seal(text)` -> `{ enc: base64 }` when the keychain is available, else
  `{ plain: text }`.
- `open(record)` -> `{ text, stale }`. A `{ plain }` record opens as is. `text`
  is null for a record this account cannot open (another machine or account, a
  missing or malformed record, no keychain). `stale` means the OS rotated its key
  (`shouldReEncrypt`), so the caller should seal the text again.

## Why

Electron 45 deprecates the synchronous `safeStorage.isEncryptionAvailable`,
`encryptString` and `decryptString`, and Electron 46 removes them; only the
asynchronous methods remain. The record format is unchanged from the synchronous
API, so data sealed by an older build opens and an older build can read what this
writes (verified on Windows). The stores keep their synchronous read interfaces by
decrypting once at startup into memory and writing changes behind.
