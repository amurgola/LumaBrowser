# BasaltLaunchPlanner

`extensions/basalt-runtime/BasaltLaunchPlanner.js`

The synchronous `planLaunch` hook: the `basalt serve` argv plus the plan object
the router, chat, Setup UI and context estimator read.

## Methods

- `BasaltLaunchPlanner.plan({ model, runtime, port, overrides?, apiKey?, diagnostics?, userArgs? })`
  returns `{ binaryPath, args, plan, killTree: true, suspend?, modelPath, authKey, cudaDevice: null, healthTimeoutMs }`
  (`suspend: { path: '/v1/sleep' }` when the pack can sleep; see Hotswap suspend below).
  - Throws `basalt planLaunch: model is required`, `runtime has no binaryPath`,
    `model has no pack path`, `port is required`, and
    [BasaltCard](BasaltCard.md)`.NO_CARD_REASON` when neither the diagnostics
    nor the install manifest name a Blackwell card.
  - Pack facts: [BasaltModelEntries](BasaltModelEntries.md)`.forModel`; the
    chat family is the entry's, else core `ModelFamilies.detect`.
  - Slots: `overrides.maxConcurrent` clamped to 1..8. KV:
    [BasaltKvMode](BasaltKvMode.md) from `overrides.cacheTypeK`. Context:
    `overrides.contextSize`, else the pack default (131,072), clamped to the
    pack maximum and fitted by [BasaltContextSizer](BasaltContextSizer.md).
  - Vision: `--vision dynamic` only when the launch asked for it
    (`overrides.suppressMmprojLoad === false`) and the pack has a projector;
    `plan.mmprojPath` is then the pack itself and `plan.mmprojAvailable` says
    whether a restart with vision can help.
  - Args: `serve <pack> --alias <id> --host 127.0.0.1 --port <p> --gpu <i>
    --max-context <n> --parallel <n>`, then `--kv <fmt>` when known,
    `--spec 0` for `overrides.noSpecDrafter`, `--vision dynamic`,
    `--api-key <key>`, `runtime.extraArgs`, and the user's own flags for the
    model (core `UserArgs.normalize`) last.
  - Cards: when the user's flags name them (`--gpu 0,1` or `--gpu=0,1`) the
    planner leaves its own `--gpu` out and the GPU note says the extra flags
    pick the cards. The context is still sized for the main card and
    `plan.singleGpu` and `plan.perGpu` still describe it alone.
  - `healthTimeoutMs`: core `LaunchFinalizer.healthTimeoutMs(weights)`.
  - `plan` carries the llama.cpp plan keys NInfer's carries (`contextSize`,
    `requestedContextSize`, `cacheTypeK/V` (the Basalt format), `fullOffload`,
    `singleGpu`, `mtp` (drafting on or off), `maxConcurrent`, `ctxPerSlot`
    (context over slots), `vramAvailableBytes`, `modelEstimatedBytes`,
    `perGpu`, ...) plus `apiModelName`, `modelFamily`, `familySamplerDefaults`
    (the family's published sampler), `mmprojAvailable`, `userArgs`,
    `basalt: true`, `mode: 'native'`, `host`, `processPattern: 'basalt'`,
    `cudaDevice` and `notes`.

## Why

`killTree`: `basalt serve` cannot replace itself on Windows, so it starts the
Python server, which starts the engine. Ending the launcher alone left the
engine running with the model in VRAM after every model switch and idle unload
(seen 2026-11-22: three engines alive after three switches), so the launch asks
core to end the whole tree.

Basalt answers a request only for the model name `/v1/models` lists (404
otherwise), so the alias is pinned with `--alias` and published as
`plan.apiModelName` for the `openai-compat` chat adapter. `--gpu` takes
nvidia-smi's numbering; a `CUDA_VISIBLE_DEVICES` pin would renumber the cards
under it, so none is set. A second card is the user's choice through the extra
flags, not the planner's: on an RTX 5090 with an RTX 3090 the second card
raised Qwen3.8 Flash Next's decode only deep into a long context and cost a
little on short conversations (2026-11-22), and only the LumaByte build takes
an RTX 40 or RTX 30 series card there. `plan.modelFamily` is what the chat reads for the
native tool-call default and the sampler. Vision `dynamic` costs no VRAM at
rest but pins 0.85 GiB of RAM, so text launches leave it off, the same contract
as llama.cpp's projector. Idle unload is the app's (it stops the process), so
`--idle-unload` is not passed; rope and YaRN flags are never passed (a context
past 262,144 ended the engine on Windows).

## Sleep (2026-11-22)

`overrides.frameworkOptions` carries the build's own options (only LumaByte's build declares them,
[BasaltCatalog](BasaltCatalog.md)). `_resolveSleep` reads `idleSleep` (seconds as a choice id; `off` or none is no
sleep) and `keepSleepRam`. With a sleep on, the args gain `--idle-sleep <seconds>` and, when keep is on,
`--keep-sleep-ram`, after `--vision`. On Windows only a pack whose entry has `sizing: 'card'` (the dense 27B) can
sleep, so another pack gets no flags and the note "Sleep: off for this launch; on Windows only the dense pack can
sleep."; on Linux every pack sleeps. A launch that sleeps notes the idle time and the flags. The `platform`
constructor option (default `process.platform`) is a test seam.

Asleep, the engine moves the model's GPU memory to RAM and gives the VRAM back; the next request wakes it in about
a second. That RAM cannot be paged out while asleep, and keep holds it while awake too, which makes later sleeps
faster. This is the engine's own sleep; the app's idle unload still stops the process.

## Hotswap suspend (add-on 1.3.1)

When the pack can sleep at all (the same `_packCanSleep` rule: every pack on Linux, the card-sized dense pack on
Windows) the launch carries `suspend: { path: '/v1/sleep' }` (`SLEEP_PATH`), next to `killTree`, whether or not the
idle sleep option is on. Core reads it in [LlmRuntimeServer](../../core/llm-server/server/LlmRuntimeServer.md): a
hotswap eviction then POSTs `/v1/sleep` and, on `asleep`, leaves the engine alive with its VRAM released instead of
ending it, so the chat model comes back from a pool swap in about 2 s instead of a full load. A `busy`, `no ram`,
`unsupported` or `not loaded` answer falls back to the stop. A pack that cannot sleep declares nothing, so its swaps
stop the engine without a round trip to an endpoint that would answer `unsupported`. Core never names Basalt: the
capability is the launch field.
