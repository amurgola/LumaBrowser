# InstalledModelRemover

`core/image-server/ipc/InstalledModelRemover.js`

Deletes an installed image model's folder after releasing every slot that uses it.

## Methods

- `new InstalledModelRemover(imageServerService)`.
- `remove(id)` throws `id required`, `invalid model id` (not a direct child of the models folder) or `not installed`. For each slot: a default pinned to the model is cleared, and the slot is stopped when it is running and hosts the model (a slot without a plan is assumed to host its pinned default). Unpin and stop failures do not block the delete. Then `rmSync(dir, { recursive, force })`.

## Why

sd-server memory-maps the weights; deleting under a live child fails part-way with EBUSY / EPERM on Windows and leaves a half-deleted folder the scanner reports as broken. Clearing the pin stops the next start resurrecting a phantom.
