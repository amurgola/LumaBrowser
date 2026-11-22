# BasaltActivation

`extensions/basalt-runtime/BasaltActivation.js`

Registers the two Basalt runtime rows, their hooks and the add-on packs.

## Methods

- `BasaltActivation.activate(context, platform = process.platform, arch = process.arch)`
  resolves `{}`. Without `context.llmCatalog.registerRuntime` it warns
  `UNAVAILABLE_WARNING` and stops. On a host outside
  [BasaltCatalog](BasaltCatalog.md)`.PLATFORMS` (macOS, any arm64 host) it
  registers nothing. Otherwise it registers every `RUNTIME_ENTRIES` row (the
  LumaByte build, then upstream's) with
  [BasaltRuntimeHooks](BasaltRuntimeHooks.md)`.hooks()`, every
  [BasaltModelEntries](BasaltModelEntries.md)`.ENTRIES` row through
  `registerModel`, and logs
  `registered runtimes basalt-luma, basalt and <n> add-on models`.

## Why

The hooks module is required lazily, so a host Basalt has no release for never
loads the install helpers. Same shape as the NInfer add-on's activation.
