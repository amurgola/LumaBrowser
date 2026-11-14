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
  5. `placement.place(...)` with `ImageSlotPlacement.requiredBytes(model, role)`.
     When [ChatSwapOut](ChatSwapOut.md)`.cardToFree` names a card (a RAM offload
     onto a card the automatic chat model fills, or on a one card box a model
     whose need exceeds the room the chat model leaves; it is handed the ledger
     debited cards without this slot's own claim and the required bytes; never
     asked on a CPU runtime), `hotswap.swapOut(role, ['llm'],
     card)` stops the chat model and waits for the card, a log line says so, live
     VRAM is re-read and the model is placed again. The chat model's next start
     evicts this model through the same round-trip pool.
  6. Plan: [VaeTilingPolicy](VaeTilingPolicy.md), `ClipPlacement.decide`
     (placement plus the CPU-runtime verdict),
     [SageAttentionPolicy](SageAttentionPolicy.md)`.decide` (skipped on a CPU
     runtime; its flag probe goes through `capabilities.supportsFlag`), the
     `--eager-load` and (when tiling) `--vae-tile-size` probes through the same
     `supportsFlag`, then `launchPlanner.plan({ model, runtime, diagnostics
     (filtered to the pinned card), port: private, publicPort, overrides: {
     offloadToCpu, vaeTiling, loraDir, autoFit, clipOnCpu, sageAttention,
     eagerLoad, vaeTileSize (VaeTilingPolicy.TILE_SIZE or null), autoFitForm } })`;
     `launch.cudaDevice` is set. `autoFitForm` is probed only when auto-fit is emitted.
  7. Log the [ImageLaunchLog](ImageLaunchLog.md) line (with the runtime swap and
     SageAttention notes) and `server.start(launch)`.
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
