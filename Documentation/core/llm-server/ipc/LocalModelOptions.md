# LocalModelOptions

`core/llm-server/ipc/LocalModelOptions.js`

The chat model picker's list of local models with per-context options.

## Methods

- `new LocalModelOptions({ llmServerService, scanner?, estimator?, liveMemory? })` (defaults
  `LlmModelsScanner.shared`, `ContextEstimator.shared`,
  `CudaDeviceProbe.withLiveMemory`).
- `options()` resolves `{ models, currentModelPath, currentContext }`: the cached
  diagnostics overlaid with live free VRAM (`liveMemory`) and handed back the loaded chat
  model's own share (`llmServerService.residentVram.withoutOwn`,
  [LlmResidentVram](../service/LlmResidentVram.md)), falling back to the cached snapshot
  on any failure; the runtimes view, a scan of the models folder, and
  `estimator.buildLocalModelOptions` with the stored fit results, the runtime from
  [FitRuntimePicker](FitRuntimePicker.md), the service's `settingsDb` (placement layout)
and the service's display names. Every
  entry then gets `grouping` ([ModelGrouping](../models/ModelGrouping.md) of its scan
  model, header included, with the stored rename as the variant), the same fields
  the Setup lists get. The
  current values are the defaults' `modelPath` and `contextSize` (null when unset).

## Why

It runs on every tab load, so nothing here spawns a probe; this path once stalled
the window for seconds at startup. The ladders are planned against the cards as a
Start would find them: a Start stops the loaded chat model before it reads the cards,
so that model's VRAM counts as free here too.
