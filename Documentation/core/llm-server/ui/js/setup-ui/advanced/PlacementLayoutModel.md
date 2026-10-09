# PlacementLayoutModel

`core/llm-server/ui/js/setup-ui/advanced/PlacementLayoutModel.js`

The placement canvas's state and every edit a drag, group or singularity action makes to it.

## Methods

- Fields `config`, `layout`, `snapshot`, `measured`, `canApply`, `splitEditor`, `combineOpen`. `applyConfig(config)`, `setSnapshot(snapshot)`, `resource(id)`, `singularity(id)`, `singularityFor(key)`, `effectiveResourceId(key)`, `context()`, `device(index)`, `ensureGpuResources()`, `groupedDevices()`, `itemAvailable(key)`, `place(key, target)` (returns the refusal text for a non-LLM on a remote GPU), `setContextSplit(enabled)`, `ensureGroup(devices)`, `ungroup(id)`, `reorderGroup(id, from, to)`, `addSingularity(resId)`, `removeSingularity(id)`, `detachLlmFromSingularities()`.

## Globals

None.
