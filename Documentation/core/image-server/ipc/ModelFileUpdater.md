# ModelFileUpdater

`core/image-server/ipc/ModelFileUpdater.js`

Swaps one role's file of an installed model for the catalog's newer file (first case: the Qwen-Image 2.1 texture-fix VAE).

## Methods

- `new ModelFileUpdater({ imageServerService, slot, catalog? })`.
- `update({ id, role }, send)` resolves `{ success: true, id, role, file, replaced }` or a failure. Refusals: `id required`, `role required`, `invalid model id`, `This model has no manifest to update.`, `Could not read manifest: <reason>`, `No catalog update for the "<role>" file of <id>.` ([ModelFileUpdates](../models/ModelFileUpdates.md), imports resolved through their family), and the busy slot. Downloads the new file through the slot, repoints the manifest, stops slots hosting the model, removes the superseded file and any INT8 copy the role carried (a failure is logged) and sends `done`.
- `ModelFileUpdater.repoint(manifest, role, update, now?)` keeps the role record, sets `file` (and the update's loader flag), drops a legacy `name` and an `int8File` (the copy was built from the old file), stamps `updatedAt`.

## Why

The slot stops before the unlink because sd-server may still have the old file mapped, and companion files are launch arguments, so a relaunch is needed anyway.
