# ImageServerSelection

`core/image-server/service/ImageServerSelection.js`

Which image server each picker role (generate, edit) routes to: the computed
local slot entries, the persisted active selection and role readiness.
ImageRouter consults the active entry: a remote one skips all local model and
VRAM logic.

## Methods

- `new ImageServerSelection({ settingsDb, remoteServers, getDefaults, resolveDisplayName })`;
  `remoteServers` is a [RemoteImageServerStore](RemoteImageServerStore.md).
- `localEntry(role)` the read-only entry for a local slot: `{ id ('local:generate'
  | 'local:edit'), name ('Local · Image Generation' | 'Local · Image Editor'),
  location: 'local', kind, selectedModelId, selectedModelLabel, available,
  managedByCore: true }`. Video reads as generate.
- `list()` both local entries, then every remote.
- `getActiveId(role)` the persisted id, default the role's local id;
  `setActiveId(role, id)` a falsy id resets to local; returns the active id.
- `getActive(role)` the local entry or the stored remote; a stale id falls back
  to the role's local slot so image work never silently breaks.
- `isReady(role, localEnabled)` a remote choice is ready on its own
  (reachability is the router's job); a local one needs the feature on and a model.
- `removeRemote(id)` removes it and reverts every role that used it to local;
  returns the kept list. `removeForPeer(peerId)` does that for each of a peer's entries.
- Statics `LOCAL_GENERATE_ID`, `LOCAL_EDIT_ID`, `ACTIVE_KEYS`, `LOCAL`.
