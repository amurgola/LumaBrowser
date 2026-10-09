# FitComboRunner

`core/llm-server/server/fit-test/FitComboRunner.js`

Measures one fit-test combo on a fresh, ephemeral llama-server. Every outcome is
a row; it never throws.

## Methods

- `new FitComboRunner({ planFor, createSupervisor, findFreePort, createFootprint, client, depthProbe, settleMs })`;
  only `planFor` is required. Defaults: `new LlmRuntimeServer()`,
  `LlmRuntimeServer.findFreePort`, `new VramFootprint()`, `new FitGenerationClient()`,
  a `DepthProbe` over that client, `TEARDOWN_SETTLE_MS`.
- `run({ model, runtime, catalogEntry, diagnostics, resolveDevice, combo, cancelled, apiKey, priorFit })`
  returns the row.
- `FitComboRunner.emptyRow({ contextTokens, kv })` the row shape: `contextTokens`,
  `kv`, `status` (`ok` | `error` | `skipped`), `ngl`, `fullOffload`, `vramBytes`,
  `vramApprox`, `ramBytes`, `tokensPerSec`, `promptTokensPerSec`,
  `completionTokens`, `tokensPerSecAtDepth`, `depthTokens`, `depthPrefillMs`,
  `depthPromptTokensPerSec`, `depthError`, `error`, `logsTail`.
- `FitComboRunner.comboOverrides({ combo, priorFit })`
  `{ contextSize, cacheTypeK, cacheTypeV, forceFlashAttn: true, suppressMmprojLoad: true }`
  plus the prior `measuredVramBytes` for the same context and KV mode.
- `SAMPLE_INTERVAL_MS` (700), `TEARDOWN_SETTLE_MS` (2500), `LOG_TAIL_LINES` (25).

## Steps and rows

1. Free port, else `No free port: <msg>`.
2. Probe plan on the whole box; `resolveDevice(modelEstimatedBytes)` picks the
   card(s); the real plan sees only those. A throw: `Plan failed: <msg>`.
   `ngl` and `fullOffload` come from the plan; the launch gets `authKey` and `cudaDevice`.
3. Footprint baseline, then `start(launch, { shouldCancel })`. A failure:
   `skipped` / `Canceled while loading.` when cancelled, else `Load failed: <msg>`
   with the last 25 log lines.
4. Cancelled now: `skipped` / `Canceled before generation.`
5. One idle sample, then the completion with 700 ms sampling. A failure keeps the
   load footprint: `Canceled during generation.` or `Generation failed: <msg>`.
6. A post-generation sample, the depth probe on the marked combo (a failure fills
   `depthError`: `Canceled during the depth probe.` or `Depth probe failed: <msg>`),
   the VRAM resolved while still loaded, stop, then the settle wait (cut short by a cancel).

## Why

Text-only like a chat launch (vision launches add the projector bytes at plan
time); flash attention forced for one measurement basis; seeded with the prior
measurement so a re-run converges onto the single card a model truly fits instead
of repeating an estimate-driven 2-GPU split. The card pick is per combo because KV
grows with context. Resolving VRAM after teardown once blanked every cell.
