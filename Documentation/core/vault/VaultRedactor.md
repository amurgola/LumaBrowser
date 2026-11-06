# VaultRedactor

`core/vault/VaultRedactor.js`

The backstop behind "the assistant never reads a secret": every saved secret (`VaultService.secrets()`, the login
passwords) is replaced with `[vault:<name>]` in text headed for the model. Values under 6 characters are skipped as too
likely to match ordinary text; longer values are replaced first.

## Methods

- `new VaultRedactor(getSecrets)` (`() => [{ value, name }]`).
- `redact(text)`, `redactDeep(value)` (strings inside plain objects and arrays, 8 levels deep).
