# ArtifactDataCache

`core/llm-server/ui/js/artifacts/ArtifactDataCache.js`

The localStorage write-through cache behind an
[ArtifactDataStore](ArtifactDataStore.md), so reads paint instantly and survive
short offline windows.

## Methods

- `ArtifactDataCache.read(rootId)` returns `{ rev, data }` from
  `localStorage['luma.ad.<rootId>']`, or `null` when missing, unparseable or
  without a numeric `rev`.
- `ArtifactDataCache.write(rootId, rev, data)` stores it; a full or missing
  storage is ignored (the host is authoritative; only the instant first paint
  is lost).
- `ArtifactDataCache.PREFIX` is `'luma.ad.'` (same key as legacy, so existing
  caches carry over).

## Globals

Reads and writes `localStorage`.
