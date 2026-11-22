# LlmPinPlanCheck

`core/llm-server/rampin/LlmPinPlanCheck.js`

Asks the launch planner whether pinning the default chat model in RAM would slow
its launch down, so [LlmPinTarget](LlmPinTarget.md) can refuse a pin that costs
more than it gives.

## Methods

- `new LlmPinPlanCheck({ planFor, preview, freeMemory, liveMemory })`: `planFor`
  defaults to `PlanFor.shared`, `preview` to a
  [StartPlanPreview](../server/launcher/StartPlanPreview.md) over it,
  `freeMemory()` to `os.freemem()`, `liveMemory(diagnostics)` to
  `CudaDeviceProbe.withLiveMemory` (the cards' free VRAM as last read, never a
  spawn).
- `refusal(service, model, { pinBytes, pinnedAlready })` resolves a reason string
  or `null`. It builds the launch's own inputs short of starting anything: a
  [LaunchContext](../server/launcher/LaunchContext.md) on the service, the
  installed runtime a launch of the model would start
  (`service.runtimeChooser.forModel`, [RuntimeChooser](../service/RuntimeChooser.md),
  so the plan matches the launch whatever the stored runtime id says; with the flags it already rejected,
  `UnsupportedFlagMemory.withLearnedFlags`), the diagnostics with live VRAM and
  the loaded model's own share handed back (`service.residentVram.withoutOwn`),
  and the overrides [LaunchOverrides](../server/launcher/LaunchOverrides.md)
  would apply. It then forces `overrides.ramPin = { freeBytes }`, where
  `freeBytes` is free RAM once the pin holds its pages (`freeMemory()` when the
  pin is already in place, else `freeMemory() - pinBytes`, never negative), and
  asks the preview for the plan. A plan with `ramPinSlowsDecode` is refused:
  `Not pinned: <model> keeps its expert weights (<size>) in RAM for the GPU to
  read, and reading them from the pinned file would about halve generation
  speed. There is not enough free RAM to hold them a second time beside the pin.`
- Resolves `null` (the pin goes ahead) when the plan is clean and also whenever
  no plan can be made: no `ensureRuntimesView` or `ensureDiagnostics` on the
  service, no installed runtime loading the model, or any
  thrown error. A refusal has to rest on a plan.

## Why

A MoE model too big for the GPU runs with every expert in RAM and the GPU
pulling the ones it needs (the MoE GPU cache launch). With a RAM pin the launch
maps the pinned file instead of reading a second copy, and mapped pages upload
at pageable speed: Qwen3.8-Flash-Next (104 GB) on an RTX 5090 decoded 63 tok/s
bulk-read and 35 mapped, prompt 1252 against 403 tok/s, on mainline b12359 and
on luma-b7 alike (2026-11-18). The pin only saves load time (12.6 s against
59 s there), so when RAM cannot hold the pool twice the pin is not held. When it
can, [LoadingPolicy](../server/launch/LoadingPolicy.md) keeps the bulk read
beside the pin and nothing is refused.

The check runs where the pin is decided (at app start, on the RAM pin toggle and
when the default model changes), so a 100 GB file is not read into locked memory
only to be given up at the first launch.
