# LocalModelOptions

`core/llm-server/ipc/LocalModelOptions.js`

The chat model picker's list of local models with per-context options.

## Methods

- `new LocalModelOptions({ llmServerService, scanner?, estimator? })` (defaults
  `LlmModelsScanner.shared`, `ContextEstimator.shared`).
- `options()` resolves `{ models, currentModelPath, currentContext }`: the cached
  diagnostics and runtimes view, a scan of the models folder, and
  `estimator.buildLocalModelOptions` with the stored fit results, the runtime from
  [FitRuntimePicker](FitRuntimePicker.md) and the service's display names. The
  current values are the defaults' `modelPath` and `contextSize` (null when unset).

## Why

It runs on every tab load, so nothing here spawns a probe; this path once stalled
the window for seconds at startup.
