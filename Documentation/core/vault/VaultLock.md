# VaultLock

`core/vault/VaultLock.js`

The optional master password. When set, the vault is locked until the user types it. While locked, the assistant
cannot use any item, and Settings cannot show, copy, edit or export a password. Normal autofill keeps working: this
is a gate in front of the riskier uses, not a second encryption layer, and the data stays sealed with the OS account
([VaultCipher](VaultCipher.md)).

Only a scrypt hash is stored (`core.vault.master`: `{ salt, hash, v }`; N 32768, r 8, p 1). It locks again after
`core.vault.autoLockMinutes` without use (5, 15 (default), 60 or 240). Five wrong guesses block for 30 s.

## Methods

- `new VaultLock(db, { now })`.
- `isSet()`, `isUnlocked()` (true without a master password), `touch()` (use keeps it open), `lock()`, `state()` ->
  `{ set, unlocked, idleMinutes }`.
- `unlock(password)`, `setPassword(current, next)` (at least 8 characters; changing needs the current one; leaves it
  unlocked), `remove(current)`.
- `idleMinutes()`, `setIdleMinutes(minutes)`.
