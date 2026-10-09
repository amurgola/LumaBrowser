# UsageStore

`core/network-sharing/UsageStore.js`

Lifetime consumption counters per paired sharing client (LLM tokens, images,
videos), keyed by TokenStore entry id. Stored under `core.sharing.usage` as
`{ [tokenId]: { totalTokens, images, videos, updatedAt } }`. Extends
[SettingsValueStore](../database/SettingsValueStore.md).

## Methods

- `new UsageStore(db)`.
- `record(tokenId, { tokens, images, videos })` adds the deltas. Negative,
  NaN and non-numeric deltas count as zero, fractions are floored, and an
  all-zero record (or empty tokenId) writes nothing.
- `get(tokenId)` returns `{ totalTokens, images, videos, updatedAt }`, zeros and
  null for an unknown client.
- `remove(tokenId)` drops one client's counters.
- `UsageStore.STORAGE_KEY`.
