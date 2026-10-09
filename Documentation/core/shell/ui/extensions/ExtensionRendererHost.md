# ExtensionRendererHost

`core/shell/ui/extensions/ExtensionRendererHost.js` (ES module)

Runs extension renderers in the shell: load, register manifest UI, activate, and on disable deactivate and remove the UI, with the stale rules that keep activate() from running twice. The full contract is in [UISlotManager](../slots/UISlotManager.md).

## Methods

- `new ExtensionRendererHost({ slotManager, meta, loader, hooks })`.
- `loadAll(extensionList, context)`: the boot load (rules 3 to 5 of the contract).
- `disable(extensionId)`: deactivate or mark stale, then `slotManager.unregisterExtension(id)`.
- `enable(extensionId)`: refresh the row, reload when needed, register manifest
  UI, re-activate; toasts on failure.
- `purge(extensionId)`, `isLoaded(extensionId)`.

## Globals

Reads `window.__ext_<id>` and sets `__lumaActive`, `__lumaDeactivated`, `__lumaStale` on it.
