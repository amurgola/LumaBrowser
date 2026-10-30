# NinferActivation

`extensions/ninfer-runtime/NinferActivation.js`

Registers the NInfer runtime, its hooks and its add-on models.

## Methods

- `NinferActivation.activate(context, platform = process.platform, arch = process.arch)`
  resolves `{}`. Without `context.llmCatalog.registerRuntime` it warns
  `UNAVAILABLE_WARNING` and stops. On a host outside `RUNTIME_ENTRY.platforms`
  (macOS, or any arm64 host) it registers nothing. Otherwise it registers the runtime with
  `NinferRuntimeHooks.hooks()`, every `NinferModelEntries.ENTRIES` row through
  `registerModel`, and logs `registered runtime ninfer and <n> add-on models`.

## Why

The hooks module is required lazily so macOS never loads the WSL helpers.
