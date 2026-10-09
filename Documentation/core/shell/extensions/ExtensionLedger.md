# ExtensionLedger

`core/shell/extensions/ExtensionLedger.js`

The manager's live state, shared by all its parts.

## Members

- `manifests` Map id -> manifest (stamped `_dir`, `_userInstalled`).
- `extensions` Map id -> `{ manifest, instance, api }` (active extensions).
- `loadOrder` array of ids, always mutated in place.
- `errors` `[{ extensionId, phase, error }]` (phases `validation`, `discovery`,
  `activation`, `chatModes`, `setupTab`).
- `unmetDeps` Map id -> the dependency key that blocked it.
- `recordError(extensionId, phase, error)`, `isActive(id)`.
- `setLoadOrder(ids)`, `insertIntoLoadOrder(id)`, `removeFromLoadOrder(id)`.
- `activeDependentOf(id)` the manifest of another active extension that
  requires `id`, or null.
- `firstInactiveRequirement(manifest)` the first required extension id that is
  not active, or null.
- `nameOf(id)` the manifest name, or the id.
