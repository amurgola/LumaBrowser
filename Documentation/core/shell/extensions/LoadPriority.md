# LoadPriority

`core/shell/extensions/LoadPriority.js`

Orders extensions by `manifest.loadPriority` (lower first, default 100).

## Methods

- `LoadPriority.of(manifest)` the priority.
- `LoadPriority.sort(ids, manifests)` a stably sorted copy.
- `LoadPriority.insert(order, id, manifests)` inserts before the first higher
  priority; mutates `order`; no-op when present.
