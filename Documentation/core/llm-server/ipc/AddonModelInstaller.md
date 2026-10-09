# AddonModelInstaller

`core/llm-server/ipc/AddonModelInstaller.js`

Extension-contributed add-on models on the Setup tab's Models card.

## Methods

- `new AddonModelInstaller({ llmServerService, slot, registry?, createSetup?, installer? })`
  (defaults `ModelCatalogRegistry.shared`, `() => new AddonModelSetup()`, `LlmRuntimeInstaller.shared`).
- `catalog()` resolves `{ models, modelsDir }`: each registry entry plus `installed`,
  `destPath` (`AddonModelSetup` statics) and `runtime` (`runtimeRow`).
- `setup(id, send)` refuses while a setup runs or the [slot](LlmDownloadSlot.md) is busy;
  holds the slot (its cancel reaches this setup), runs `AddonModelSetup#execute`
  with a forced runtime rescan as `detectRuntime` and the LLM installer, drops the
  runtimes cache on a nested runtime `finalize` and at the end. Resolves
  `{ success: true, result }`, `{ success: false, canceled: true }` (sending
  `canceled`) for `CANCELED` or a canceled handle, else sends
  `error { message, code, detail }` and resolves `{ success: false, error, code, detail }`.
- `cancel()` marks the live setup's handle canceled and cancels its transfer.
- `AddonModelInstaller.runtimeRow(entry, runtimesById)` `{ id, name, installed,
  installable, hardware, platforms, version }`, a `missing: true` row for a runtime
  no detector knows, or null when the entry needs none.
