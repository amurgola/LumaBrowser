# ArtifactDataStore

`core/llm-server/chat/ArtifactDataStore.js`

Persistent key/value data for `type: 'live'` artifacts: the backend of the
`store` API injected into a live module's JS. One JSON object per logical
artifact in `llm_artifact_data`, keyed by the version chain's root id, so
editing a module (which inserts a new artifact row) never loses its saved state.
Extends `EventEmitter`.

## Methods

- `new ArtifactDataStore({ settingsDb })`.
- `resolveRootId(idOrRootId)`: a version id or root id to the chain's root id,
  or `null` when no artifact claims it (data rows are only created for
  artifacts that exist).
- `all(id)`: `{ success: true, rootId, data, rev, updatedAt }`; a chain with no
  data is `{}` at rev 0. A corrupt stored object reads as `{}`.
- `get(id, key)`: `{ success: true, rootId, rev, value }`.
- `mutate(id, { set?: { key: value }, remove?: [key] })`: the single write
  primitive. Returns `{ success: true, rootId, rev, keys, data }` or
  `{ success: false, error }`; never throws.
- `set(id, key, value)`, `remove(id, key)`: one-key `mutate`.
- `deleteForRoot(id)`: drops the chain's data (its delete path); resolves
  leniently because the artifact rows may already be gone. True when a row
  was removed.
- Event `'change'` with `{ rootId, rev, keys, data }` after every successful
  write, and `{ rootId, rev: 0, keys: [], data: {} }` after a delete, so
  `main.js` can broadcast to the LLM and Dashboard tabs.
- `ArtifactDataStore.QUOTAS`: `{ MAX_KEYS, MAX_KEY_LEN, MAX_VALUE_BYTES,
  MAX_TOTAL_BYTES }` (see [ArtifactDataQuota](artifacts/ArtifactDataQuota.md)).

## Write model

Per-key mutations, never a whole-object PUT, applied host-side in one
transaction so two widgets writing different keys cannot clobber each other.
better-sqlite3 is synchronous, so this also serialises concurrent writers by
arrival order (per-key last write wins). Every write bumps `rev`, which clients
use to reconcile their localStorage cache and drop self-echo change events.
A write that fails a quota changes nothing.

## Trust

The injected renderer-side `store` binds one root id, but inline live-artifact
JS runs unsandboxed in the LLM tab and could reach the preload API directly,
so cross-artifact isolation here is soft. That matches the artifact trust model
(artifact JS can already call every llmDiagAPI method). The quotas bound
database bloat; the anonymous `/share` surface is read-only and `/sharing`
writes need the pairing token.
