# LlmDiagnosticsView

`core/llm-server/ipc/LlmDiagnosticsView.js`

The LLM tab's hardware panel data.

## Methods

- `new LlmDiagnosticsView(llmServerService)`.
- `diagnostics(options)` resolves `{ data, fromCache, vramPressure }`. Serves the
  persisted snapshot unless `options.force` (the Reload button); `fromCache` is
  true only when not forced and a snapshot existed. `vramPressure` is the live
  watchdog state, kept beside the snapshot (never persisted inside it).
- `resetNvidiaSmiPathHint()` un-dismisses the nvidia-smi PATH banner and forgets
  the saved path (a dev-console escape hatch).

## Why

Probing hardware is what made startup feel slow, so freshness is traded for
responsiveness; hardware almost never changes between runs.
