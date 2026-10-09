# InstalledImageModels

`core/image-server/service/InstalledImageModels.js`

Every model in this machine's image models directory, listed per slot kind for
the Network Sharing host manifest so a paired client can pick a specific model.

## Methods

- `new InstalledImageModels({ scanner, getModelsDir, getDefaults, resolveDisplayName })`.
- `list(kind?)` resolves `[{ id, label, kind, current }]`, filtered to `kind`
  (`generate`, `edit`, `video`) when given. `label` is the display name, else the
  record label, else the id. `current` compares against the slot's default
  (`modelId`, `editModelId`, `videoModelId`). Sorted current first, then by label.
- `InstalledImageModels.slotKindsOf(model)` unlabelled kinds are `generate`; a
  unified generate+edit model (`supportsEdit`) is `['generate', 'edit']`.
