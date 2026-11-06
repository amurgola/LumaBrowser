# VaultCipher

`core/vault/VaultCipher.js`

Seals the vault with Electron `safeStorage` (DPAPI on Windows, the Keychain on macOS, the secret service on Linux), so
the stored data only opens for this OS account. Without a keychain it stores plain text and the Passwords panel warns.

## Methods

- `new VaultCipher(crypto?)` (defaults to Electron's safeStorage, loaded lazily).
- `available()`.
- `seal(text)` -> `{ enc: base64 }` or `{ plain: text }`.
- `open(record)` -> the text, or null when this account cannot open it.
