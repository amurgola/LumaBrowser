# LaunchPlanner

`core/llm-server/server/LaunchPlanner.js`

Plans a llama-server launch for a (model, runtime, host) triple: the hardware-aware
VRAM fit across GPUs, KV and expert placement, the layer split, speculation and
serving flags, returned as a ready-to-spawn argv plus a `plan` describing every
decision. Extends [MediaLaunchPlanner](../../media-shared/MediaLaunchPlanner.md).
Pure; the only I/O is an nvidia-smi read when an RPC split runs without a CUDA
snapshot. The work is done by small stage classes in [launch/](launch/).

## Methods

- `new LaunchPlanner().plan({ model, runtime, diagnostics, port, overrides, apiKey, userArgs })`
  returns `{ binaryPath, modelPath, mmprojPath, args, plan }`.
  - `model`: a scanner entry (`name`, `weights[]`, `weightsTotalBytes`, `gguf`,
    optional `mmproj[]`/`mmprojTotalBytes`, `drafter[]`/`drafterTotalBytes`,
    `mtp[]`/`mtpTotalBytes`, `mtpCapable`, `mtpGrafted`).
  - `runtime`: a detector row (`id`, `name`, `binaryPath`, `version`,
    `unsupportedFlags`, `skipFeatures`, `extraArgs`, `specDialect`). Learned
    flags come in through [UnsupportedFlagMemory](UnsupportedFlagMemory.md)`.withLearnedFlags`.
  - `overrides`: `contextSize`, `cacheTypeK`, `cacheTypeV`, `forceFlashAttn`,
    `noKvOffload`, `maxConcurrent`, `cacheReuse`, `promptCacheRam`, `cpuMoe`,
    `noAutoCpuMoe`, `tensorSplitMode`, `manualTensorSplitActive`, `rpcServers`,
    `rpcSkippedFitsLocal`, `rpcSkippedMoeOffload`, `vramCapBytes`,
    `measuredVramBytes`, `ramPin` (`{ freeBytes }`), `useMmap` (hotswap),
    `suppressMmprojLoad`, `noSpecDrafter`, `noNgramSpec`, `quantizeDraftCache`.
  - `apiKey` (a non-empty string becomes `--api-key`), `userArgs` (free text or
    an array, appended last through [UserArgs](UserArgs.md)).
  - Throws `LaunchPlanner: model is required`, `runtime is required`,
    `runtime has no binaryPath`, `model has no weight files`, `port is required`.
- `LaunchPlanner.DEFAULT_CONTEXT` (4096), `LaunchPlanner.PROMPT_CACHE_RAM_SETTING_KEY`
  (`core.llm.promptCacheRam`).

## Pipeline

`plan()` runs the base class steps; `_resolveSettings` resolves these stages in
order into one state object, each a class in `launch/`:

1. Inputs: [ModelFiles](launch/ModelFiles.md), [RuntimeFlags](launch/RuntimeFlags.md), API key, user args.
2. Model settings: [KvSettings](launch/KvSettings.md), [SlotPlan](launch/SlotPlan.md),
   [SpeculationPlan](launch/SpeculationPlan.md), [VisionProjectorPlan](launch/VisionProjectorPlan.md).
3. Budget: [VramBudget](launch/VramBudget.md), then [TensorParallelGate](launch/TensorParallelGate.md)
   (which forces f16 KV before anything is priced).
4. Placement: [MoeExpertPlan](launch/MoeExpertPlan.md), [OffloadDecision](launch/OffloadDecision.md),
   [SplitPlan](launch/SplitPlan.md).
5. Serving: [LoadingPolicy](launch/LoadingPolicy.md), [FamilyTuning](launch/FamilyTuning.md), skipped flags.

Then [LaunchArgsBuilder](launch/LaunchArgsBuilder.md) assembles argv, and the plan
is [PlanSummary](launch/PlanSummary.md) over the state plus the
[PlanDecodeEstimator](decode/PlanDecodeEstimator.md) estimate and the notes from
[PlacementNotes](launch/PlacementNotes.md), [ModelFeatureNotes](launch/ModelFeatureNotes.md)
and [ServingNotes](launch/ServingNotes.md), in that order.

## Plan keys

`contextSize`, `userArgs`, `loadMode` (`none`|`mmap`), `loadModeFlag`, `mmprojPath`,
`mmprojAvailable`, `requestedContextSize`, `modelFamily`, `familySamplerDefaults`,
`drafterPath`, `specType`, `mtpDraftNMax`, `draftCacheType`, `cacheTypeK`,
`cacheTypeV`, `kvQuantForcedF16`, `ngl`, `fullOffload`, `partial`, `gguf`,
`singleGpu`, `splitMode`, `tensorSplit`, `tensorSplitRequested`, `layerSplit`,
`flashAttn`, `swaFull`, `cacheReuse`, `cacheReuseRequested`, `cacheReuseMinChunk`,
`promptCache`, `mtp`, `ngramSpec`, `maxConcurrent`, `maxConcurrentRequested`,
`ctxPerSlot`, `cpuMoe`, `cpuMoeRequested`, `cpuMoeAuto`, `moeSplit`, `rpc`,
`apiKeyRequired`, `skippedFlags`, `vramAvailableBytes`, `modelEstimatedBytes`,
`headerEstimatedBytes`, `measuredVramBytes`, `perGpu`, `decodeEstimate`,
`runtimeId`, `runtimeName`, `modelName`, `port`, `notes`. Identical to legacy.

## Why

This is the product's differentiator: it decides whether a model runs at GPU
speed, spills layers, or moves MoE experts to RAM, from the GGUF header and the
live hardware, before a slow launch can fail. Every constant is a measurement and
is kept byte-for-byte; the reasoning behind each lives in the stage docs.

The split follows the legacy function's own sections. The stages share one state
object rather than long argument lists, so a stage reads as "given what has been
decided so far". `_validate` keeps the legacy check order.
