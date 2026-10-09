# RemoteImageServerStore

`core/image-server/service/RemoteImageServerStore.js`

The user's remote image servers (a raw sd-server, or a paired LumaBrowser
peer's shared slot) as one JSON array under `core.imageServer.serverConfigs`.
Extends `JsonCollectionStore` (runs `SettingsValueStoreContract`).

## Methods

- `new RemoteImageServerStore(settingsDb)`.
- `list()` stored entries with `location: 'remote'` and no `managedByCore`.
- `save(list)` keeps remote entries with an `endpoint` and an id, cleaned to
  `{ id, name (else endpoint), location: 'remote', kind ('edit' | 'generate'),
  endpoint, token, peerId, peerManaged, models ([{ id, label }] or null),
  modelLabel, selectedModel }`; returns what was stored.
- `upsert(entry)` adds or replaces by id (location forced to remote).
- `setSelectedModel(id, modelId)` `{ success: true, selectedModel }`, or
  `{ success: false, error }` with `NOT_FOUND` (`Remote image server not found.`)
  or `NOT_OFFERED` (`That model is not offered by this server.`). An entry with no
  model list accepts any pick; a falsy pick clears it (the host uses its default).
- `remove(id)` returns the kept list. `idsForPeer(peerId)`.

## Why

The two local slots are computed entries and never stored, so a UI round trip
that sends them back is stripped here instead of stranding a stale copy.
`selectedModel` rides every proxied request so the host loads exactly the model
this client picked.
