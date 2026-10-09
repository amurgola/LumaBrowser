# PeerStore

`core/network-sharing/client/PeerStore.js`

The paired peers this machine consumes, stored as one list under the settings
key `core.sharing.peers`. Extends [SettingsValueStore](../../database/SettingsValueStore.md);
a missing or non-array value reads as empty.

Record shape: `{ id, name, endpoint, token, certPem, tlsFingerprint, addedAt,
lastSeenAt, manifest, enabled, online, error, gpusAttached, _failCount,
_nextAttemptAt, _imageServersAdopted }`.

## Methods

- `new PeerStore(db)`; `PeerStore.STORAGE_KEY`.
- `all()` the list; `find(id)` one record or `null`; `writeAll(peers)` replaces it.
- `patch(id, patch)` shallow-merges; a peer that is gone is left gone.
- `upsert(peer)` merges into an existing id or appends.
- `remove(id)` drops one peer.
- `resetBackoff()` deletes `_failCount` / `_nextAttemptAt` everywhere, writing only if something changed.
