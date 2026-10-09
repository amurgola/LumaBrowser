# ArtifactDataStore

`core/llm-server/ui/js/artifacts/ArtifactDataStore.js`

The `store` a live artifact module receives: saved data for one artifact chain.
The host database is authoritative.

## Methods

- `ArtifactDataStore.create({ rootId, transport })` builds a store. `rootId` is
  any id in the artifact's chain (a version id is fine: the host echoes the
  canonical root id and the store adopts it). `transport` is
  `{ kind: 'ipc', api }` (the preload's `artifactData` surface, for the LLM tab
  and Dashboard) or `{ kind: 'http', base, token?, readOnly?, pollMs? }` (pop-out
  page, PWA, `/share`). See [IpcDataTransport](IpcDataTransport.md) and
  [HttpDataTransport](HttpDataTransport.md).
- `new ArtifactDataStore(rootId, transport)` takes any
  [ArtifactDataTransport](ArtifactDataTransport.md). Hydration starts at once.

Module-facing (also usable destructured, as the legacy closure object allowed):

- `get(key)`, `all()`: wait for the first hydrate only when nothing is known yet
  (the [cache](ArtifactDataCache.md) paints instantly otherwise). `all` returns a
  copy.
- `set(key, value)`, `remove(key)`: apply locally at once, then write to the
  host. A refusal (quota, read-only view, offline, 4xx) rolls back and throws
  the host error; a read-only transport throws `this view is read-only`.
- `onChange(cb)`: `cb({ keys, data, rev })` after every adopted snapshot; returns
  an unsubscribe. Subscribing starts host pushes (IPC) or polling (HTTP, every
  `pollMs`, only while at least one listener exists).
- `readOnly` getter.

Host page only: `dispose()` stops notifications and subscriptions on unmount.

## Reconciling

A snapshot is adopted only when its `rev` is higher than the store's, so stale
replies and the store's own echoes are dropped. A push says "rev N exists" and
the store refetches unless it already has N.

## Globals

`window.localStorage` (through ArtifactDataCache), `fetch` (HTTP transport).
