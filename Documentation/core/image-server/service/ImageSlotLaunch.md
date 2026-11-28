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
     overlaid; resolve the runtime (keeping the detector's rows), then the model;
     refuse missing API keys. Then
     [PreferredImageRuntime](PreferredImageRuntime.md)`.pick` may move this
     launch onto a runtime the model's row prefers (MiniMax-H3 onto the LumaByte
     build when installed and new enough); settings are untouched. Its `error`
     (the runtime left to launch is older than the row's `minRuntimeTags`, for
     example an `sd-cpp-luma` before `luma-b4` for MiniMax-H3-Image) is the last
     refusal, before any port or VRAM work (ISSUES.md entry 11).
  3. Two ports from the slot's window: public (auth proxy) then private (sd-server, loopback).
  4. `hotswap.acquire(role)`; when it evicted a sibling, re-read live VRAM.
  5. `placement.place(...)` with `ImageSlotPlacement.requiredBytes(model, role, measuredPeak)`,
     the measured peak read from `MeasuredFootprintStore.peakVramBytes(modelId)` (0 when never measured).
     When [ChatSwapOut](ChatSwapOut.md)`.cardToFree` names a card (a RAM offload
     onto a card the automatic chat model fills, or on a one card box a model
     whose need exceeds the room the chat model leaves; it is handed the ledger
     debited cards without this slot's own claim and the required bytes; never
     asked on a CPU runtime), `hotswap.swapOut(role, ['llm'],
     card)` stops the chat model and waits for the card, a log line says so, live
     VRAM is re-read and the model is placed again. The chat model's next start
     evicts this model through the same round-trip pool.
  6. Plan: [VaeTilingPolicy](VaeTilingPolicy.md), `ClipPlacement.decide`
     (placement plus the CPU-runtime verdict), the INT8 weights decision (the
     model's diffusion entry has an `int8Path` on disk, see
     [ImageModelFiles](../ImageModelFiles.md), and
     `SageAttentionPolicy.isCudaRuntime(runtime)`: Vulkan and CPU builds keep the
     16-bit file), [SageAttentionPolicy](SageAttentionPolicy.md)`.decide` (with
     `int8Weights`, which asks for SageAttention like a row's `sageAttention`
     flag; skipped on a CPU runtime; its flag probe goes through
     `capabilities.supportsFlag`), the
     `--eager-load` and (when tiling) `--vae-tile-size` probes through the same
     `supportsFlag`, then `launchPlanner.plan({ model, runtime, diagnostics
     (filtered to the pinned card), port: private, publicPort, overrides: {
     offloadToCpu, vaeTiling, loraDir, autoFit, hotswapPooled, clipOnCpu, sageAttention,
     int8Weights, eagerLoad, vaeTileSize (VaeTilingPolicy.TILE_SIZE or null), autoFitForm } })`;
     `launch.cudaDevice` is set. `autoFitForm` is probed only when auto-fit is emitted.
     `hotswapPooled` is `hotswap.isPooled(role)` read after step 5, so it covers a
     layout singularity and the round trip a chat swap-out just formed; false on a
     CPU runtime (no card to share) or a hotswap without `isPooled`. The planner
     then emits `--offload-to-cpu` (unless the slot is split over several cards),
     so the slot sleeps between renders and a swap suspends it. The placement's own `offloadToCpu` (and with it
     VAE tiling and text encoder placement) is left as placed: the weights fit.
     Same rule for all three slots (generate, edit, video), which share this
     launch and planner.
  7. Log the [ImageLaunchLog](ImageLaunchLog.md) line (with the runtime swap,
     INT8 weights and SageAttention notes) and `server.start(launch)`. The line's
     offload posture is the planned launch's own (`plan.offloadToCpu`), so a pooled
     slot reads "CPU weight-offload on", not "resident".
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
INT8 weights run the linear layers on INT8 tensor cores, which only a CUDA build
of sd.cpp has (measured 2026-11-22 on Anima: 5.6 steps/s against 3.4 on an RTX
5090, 2.4 against 1.25 on an RTX 3090). Placement still sizes the model by its
16-bit files, which overstates the need of an INT8 launch.
