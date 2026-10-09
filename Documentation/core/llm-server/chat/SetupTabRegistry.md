# SetupTabRegistry

`core/llm-server/chat/SetupTabRegistry.js`

The registry of tabs extensions contribute to the LLM tab's Setup surface, plus
one invoke handler per extension. Extends
[ContributionRegistry](../../shared/registry/ContributionRegistry.md).

## Methods

- `SetupTabRegistry.shared` is the process-wide instance.
- `register({ id, label?, url? }, extensionId)` stores `{ id, label, url }`
  (`label` defaults to the id, `url` to `null`).
- `unregister(id)`, `get(id)`, `has(id)` as in the base.
- `unregisterByExtension(extensionId)` removes the extension's tabs and its
  invoke handler.
- `list()` returns `[{ id, label, url }]`.
- `setInvokeHandler(extensionId, handler)` registers
  `handler(action, payload)`; ignored without an extension id or a function.
- `invoke(extensionId, action, payload)` is async and calls the handler, or
  rejects with `setup.invoke: no handler registered for "<id>"`.

## Why

The Setup-area counterpart to ChatModeRegistry, shared for the same reason (core
boots first, extensions activate later). Tab metadata is stamped by
ExtensionManager from `manifest.setupTab`; the renderer lists it via
`setup.listTabs`, injects each tab's bundle and mounts it.

The invoke handler is reached over the `setup.invoke` IPC, not `/api`, because
`/api` can require an API key the renderer does not hold; this lets a Setup UI do
CRUD without auth friction.

One extension may own several tabs (a flag-gated tab can be toggled at runtime).
The legacy reverse index used to be 1:1, so a second `register` orphaned the
first tab: deactivate left it listed with its handler gone.
