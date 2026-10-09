# ApiKeyEntry

`core/shell/api-security/ApiKeyEntry.js`

Builds and edits the stored API key entries of [ApiSecurity](../ApiSecurity.md),
and reads a presented key from request headers.

## Methods

- `ApiKeyEntry.create(label, now = new Date())` returns
  `{ id, label, key, createdAt, lastUsedAt: null }` with a random UUID id.
- `ApiKeyEntry.refreshed(entry, now)` keeps id and label, issues a new key and
  `createdAt`, and clears `lastUsedAt`.
- `ApiKeyEntry.relabeled(entry, label)` changes only the label.
- `ApiKeyEntry.generateValue()` returns `'luma_'` plus 64 hex characters.
- `ApiKeyEntry.cleanLabel(label)` cuts to 120 characters, trims, and falls
  back to `'Untitled key'`.
- `ApiKeyEntry.fromHeaders(headers)` returns the key from `Authorization:
  Bearer <key>` (case-insensitive), else from `X-Api-Key`, trimmed, or `null`.
