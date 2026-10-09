# ImageSlotLaunch

`core/image-server/service/ImageSlotLaunch.js`

One launch of a model on an image slot. A new instance per launch, created by
`ImageServerService#startServerResolved`.

## Methods

- `new ImageSlotLaunch(service, deps)`; `service` is the ImageServerService,
  `deps` its launch dependencies (`getDiagnostics`, `liveMemory`, `inputs`
  ([ImageLaunchInputs](ImageLaunchInputs.md)), `placement`
  ([ImageSlotPlacement](ImageSlotPlacement.md)), `vramCoordinator`, `hotswap`,
  `capabilities`, `launchPlanner`, `findFreePort(role, opts)`, `log`).
- `run(modelIdOverride?, { role? })` resolves `{ success, status, plan }` or
  `{ success: false, error }` (rejects only if the planner or supervisor throws):
  1. Role (normalised), its supervisor, the defaults; the model is the override
     or the slot's default (an override never touches settings).
  2. Refuse a missing default runtime or model; read diagnostics with live VRAM
     overlaid; resolve the runtime, then the model; refuse missing API keys.
  3. Two ports from the slot's window: public (auth proxy) then private (sd-server, loopback).
  4. `hotswap.acquire(role)`; when it evicted a sibling, re-read live VRAM.
  5. `placement.place(...)` with `ImageSlotPlacement.requiredBytes(model, role)`.
  6. Plan: [VaeTilingPolicy](VaeTilingPolicy.md), `ClipPlacement.decide` (with the
     debited cards and [UserGpuPin](UserGpuPin.md)), then
     `launchPlanner.plan({ model, runtime, diagnostics (filtered to the pinned
     card), port: private, publicPort, overrides: { offloadToCpu, vaeTiling,
     loraDir, autoFit, clipOnCpu, autoFitForm } })`; `launch.cudaDevice` is set.
     `autoFitForm` is probed only when auto-fit is emitted.
  7. Log the [ImageLaunchLog](ImageLaunchLog.md) line and `server.start(launch)`.
- `ImageSlotLaunch.existingLoraDir(modelsDir, { existsSync? })` `<modelsDir>/loras`
  when it exists, else `null`.

## Why

The diagnostics snapshot is a persisted cache whose free memory can predate
every model loaded since, so placement reads the cards live. On a singularity
swap the first live read still shows the evicted LLM; sizing against it handed a
Qwen-Image 2.1 edit `--offload-to-cpu` (120 s instead of 40 s, 2026-09-21), so the
cards are re-read after the eviction lands. The planner's own offload heuristic
must size against the pinned card, not the whole box. The LoRA folder is only
passed when it exists, so a box that never imported one launches as before.
