# MlxLaunchPlanner

`core/llm-server/server/MlxLaunchPlanner.js`

Plans an `mlx_lm.server` launch on Apple Silicon, the counterpart of the
llama.cpp launch planner. Extends [MediaLaunchPlanner](../../media-shared/MediaLaunchPlanner.md).

## Methods

- `new MlxLaunchPlanner().plan({ model, runtime, port, overrides })` returns
  `{ binaryPath, args, plan, modelPath, mmprojPath: null }`:
  - `args` is `--model <dir> --host 127.0.0.1 --port <port>`;
  - `modelPath` is `model.weights[0].path`, the MLX model directory;
  - `plan` has every key a llama.cpp plan has (`contextSize`, `ngl: null`,
    `fullOffload: true`, `maxConcurrent`, `apiKeyRequired: false`, `perGpu: []`,
    `runtimeId`, `modelName`, `port`, `notes`, and so on) plus `mlx: true`.
- `overrides.contextSize` (floored, default `DEFAULT_CONTEXT` 4096) and
  `overrides.maxConcurrent` (floored, at least 1) are mirrored onto the plan.
- Throws `MlxLaunchPlanner: <model|runtime|port> is required`,
  `runtime has no binaryPath` or `model has no weight path`.

## Why

mlx_lm.server loads a model directory (config, safetensors, tokenizer), not one
.gguf; it has no -ngl, flash-attention or KV-precision surface because MLX runs
on unified memory; and it speaks the OpenAI API with a `GET /health`, so the
OpenAI-compatible adapter and the supervisor's health probe work unchanged.

Context is sized per request by the server; the persisted choice is still put on
the plan so the router's restart-on-context-change check behaves. Concurrency is
mirrored onto the queue gate only; the server keeps its own decode concurrency.
The plan carries the llama-shaped keys so the router, queue gate and UI need no
MLX special cases.

It fits MediaLaunchPlanner genuinely: validate, resolve settings, build argv,
resolve binary, describe plan. It overrides `plan()` only to add `modelPath` and
`mmprojPath`, which the llama-style callers read.
