# StartPlanPreview

`core/llm-server/server/launcher/StartPlanPreview.js`

The plan a Start would make, with nothing started and no card claimed. The Setup
fit matrix ([RungEstimator](../../context/RungEstimator.md)) and the RAM pin
check ([LlmPinPlanCheck](../../rampin/LlmPinPlanCheck.md)) both ask it.

## Methods

- `new StartPlanPreview({ planFor, catalog, placement })`: a
  [PlanFor](../PlanFor.md), an [LlmRuntimeCatalog](../../runtimes/LlmRuntimeCatalog.md)
  and a placement with `previewCudaDevice` (default an
  [LlmPlacement](LlmPlacement.md) over `VramCoordinator.shared`).
- `plan({ model, runtime, diagnostics, settingsDb, overrides })` returns the
  plan object. It follows the launcher's two steps: a probe plan on every card
  (`port: 8080`, `runtimeCatalogEntry: catalog.getById(runtime.id)`), the card
  pick `placement.previewCudaDevice({ diagnostics, settingsDb, plan: probe })`,
  then the plan on the picked cards (diagnostics narrowed and ordered by
  `CudaPin.filterDiagnosticsToDevices`). A custom-launch runtime (MLX, an
  extension's planner) or no pin keeps the probe plan. `diagnostics` should
  carry a live VRAM reading; `settingsDb` lets the pick follow the user's
  placement layout. A planner error is thrown to the caller.
- `StartPlanPreview.PORT` (8080): nothing is spawned, but the planners require a port.

## Why

Planning against the whole box describes a launch nobody runs: the launcher
pins cards first and the planner then sizes against those. A preview that skips
the pick said "fits" where Start split a model over two cards (2026-11-18), so
every preview goes through the same two steps.
