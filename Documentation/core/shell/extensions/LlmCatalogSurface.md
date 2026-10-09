# LlmCatalogSurface

`core/shell/extensions/LlmCatalogSurface.js`

`context.llmCatalog`: inference runtimes and downloadable add-on models contributed by an extension.

## Methods

- `new LlmCatalogSurface({ runtimes = RuntimeCatalogRegistry.shared, models = ModelCatalogRegistry.shared, coreServices })`; `key` is `llmCatalog`.
- `forExtension(id)` -> `{ registerRuntime(entry, hooks), unregisterRuntime(runtimeId), listRuntimes(),
  registerModel(entry), unregisterModel(modelId), listModels() }`. Registering a
  runtime, or removing one that existed, calls [LlmRuntimesView](LlmRuntimesView.md)
  so the Setup tab lists it without a restart.
