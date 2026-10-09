# LiveCatalog

`core/llm-server/models/LiveCatalog.js`

Serves the curated catalog instantly and offline: a live
[CatalogBuilder](CatalogBuilder.md) build cached for 6 hours, falling back to
the last good build or the static [CuratedModelCatalog](CuratedModelCatalog.md).

## Methods

- `LiveCatalog.shared` the process-wide instance.
- `new LiveCatalog({ builder = new CatalogBuilder(), fallback = CuratedModelCatalog.listCatalog, ttlMs = 6 h })`.
- `get({ now = Date.now(), force = false, signal })` resolves `{ models, source, errors }`:
  - `cache`: a build younger than the TTL (unless `force`), no fetch;
  - `live`: a fresh build with at least one model, which replaces the cache;
  - `fallback`: the build was empty or threw; serves the cached models, else the
    static list. A failed build never replaces the cache.
- `reset()` drops the cache.
- `LiveCatalog.REFRESH_TTL_MS`.

## Why

The wizard wants the catalog instantly and offline. Time is injected so the TTL
is testable without fake timers.
