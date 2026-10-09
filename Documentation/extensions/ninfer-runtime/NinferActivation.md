# NinferActivation

`extensions/ninfer-runtime/NinferActivation.js`

Registers the NInfer runtime, its hooks and its add-on models.

## Methods

- `NinferActivation.activate(context, platform = process.platform)` resolves `{}`.
  Without `context.llmCatalog.registerRuntime` it warns `UNAVAILABLE_WARNING`
  and stops. On a platform outside `RUNTIME_ENTRY.platforms` (macOS) it
  registers nothing. Otherwise it registers the runtime with
  `NinferRuntimeHooks.hooks()`, every `NinferModelEntries.ENTRIES` row through
  `registerModel`, and logs `registered runtime ninfer and <n> add-on models`.

## Why

The hooks module is required lazily so macOS never loads the WSL helpers.
