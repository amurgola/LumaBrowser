# VaultRedaction

`core/vault/VaultRedaction.js`

The process-wide redaction hook. FoundationServices installs the vault's [VaultRedactor](VaultRedactor.md) at boot.
The chat's TruncationGuard passes every tool result through `apply()`, so a page that shows a password or a command
that prints one never puts it in the model's context. Without an installed redactor `apply()` returns its input.

## Methods

- `VaultRedaction.install(redactor | null)`, `VaultRedaction.apply(value)`.
