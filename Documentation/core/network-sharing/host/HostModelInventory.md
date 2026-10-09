# HostModelInventory

`core/network-sharing/host/HostModelInventory.js`

What the host's local LLM and image services have installed, reduced to what a
paired client may see: ids, labels and the current pick, never paths. Every
read degrades to null when a service cannot enumerate.

## Methods

- `new HostModelInventory({ llmServerService, imageServerService })`.
- `localLlmModels()`: `listInstalledChatModels()` or null.
- `localContextWindow()`: `getEffectiveContext().ctxPerSlot` floored, or null.
- `imageModels(kind)`: `[{ id, label, current }]` for `'generate'` or `'edit'`, or null.
- `imageModelDenied(role, modelId)`: null when allowed (no model always is),
  `'model selection is not supported on this host'` when the slot cannot be
  enumerated, `'model is not available'` when the id is not in the slot's list.
