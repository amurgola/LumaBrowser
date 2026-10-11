# RuntimeStatusStore

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeStatusStore.js`

The last runtimes view keyed by runtime id plus the upstream update info: the source of truth for "installed" across the model rows and the Defaults pickers.

## Methods

- `setView(view)`, `get(id)`, `isInstalled(id)`, `isUsable(id)` (installed and the backend check did not fail), `backendLoaded(id)` (the backend check listed a device), `all()`, `installedInference()`, `claimedModelKinds()`, `setUpdate(id, info)`, `update(id)`.

## Globals

None.
