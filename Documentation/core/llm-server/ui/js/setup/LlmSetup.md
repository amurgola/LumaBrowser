# LlmSetup

`core/llm-server/ui/js/setup/LlmSetup.js`

The local-LLM [setup pipeline](SetupPipeline.md): runtime, resumable model
download, defaults, server start.

## Methods

- `LlmSetup.run(api, opts)`; `api` is llmDiagAPI-shaped (`getRuntimesView`,
  `installRuntime`, `downloadModel`, `setDefaults`, `startServer`, optional
  `restartServer`, `onRuntimeEvent`, `onModelEvent`; the `on*` calls return an
  unsubscribe). `opts`: `{ rec, override?, advanced?, isCanceled?, onPhase?,
  onBar?, onSub? }`.
  1. [RuntimeEnsurer](RuntimeEnsurer.md) for `rec.runtimeId`, or `mlx-lm` when
     `override.mlx` (MLX is never auto-installed; the user gets pip guidance).
  2. "Downloading model…": the download spec is `override` (`{ url, filename }`
     or `{ mlx, repoId }`), else `advanced` (`{ hf }`), else the recommendation.
     Progress via [SetupProgressEvents](SetupProgressEvents.md), plus
     `Resuming…` and `Paused` sub-lines. A paused download returns
     `{ ok: false, paused: true }` (the bytes are kept; rerunning resumes).
  3. "Configuring & starting the server…": `setDefaults({ runtimeId, modelPath,
     contextSize, kvCacheType, cpuMoe? })` (`cpuMoe` only when the plan sets it),
     then [ServerStarter](ServerStarter.md).
  Resolves `{ ok: true, file, destPath, alreadyPresent }`.

## Globals

None.
