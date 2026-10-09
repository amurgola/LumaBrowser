# RouterLaunchPlan

`core/llm-server/router/RouterLaunchPlan.js`

How the tool-group router's llama-server is launched.

## Methods

- `RouterLaunchPlan.pickRuntime(runtimes, defaultRuntimeId)` among installed
  `llama-cpp*` rows with a binary: the first of `RUNTIME_PREFERENCE`
  (`llama-cpp-luma`, `llama-cpp-cpu`, `llama-cpp-cuda13`, `llama-cpp-cuda12`),
  else the default runtime, else the first usable. Throws
  `No llama.cpp runtime is installed.`
- `RouterLaunchPlan.threads(cpuCount)` half the cores, clamped to 2..8.
- `RouterLaunchPlan.buildArgs({ modelPath, port, threads })`
  `-m <model> --host 127.0.0.1 --port <port> -ngl 0 -c 4096 -np 1 -t <threads>`.
- `RouterLaunchPlan.build({ runtime, modelPath, port, cpuCount })` the
  `RouterRuntimeServer#start` launch: `{ binaryPath, args, plan: { port }, healthTimeoutMs: 60000, cudaDevice: '-1' }`.

## Why

CPU-only with every GPU hidden (`cudaDevice '-1'`) so a CUDA build never opens a
context and takes VRAM from the chat model. The luma build loads fastest; any
stock llama.cpp build works since the router runs `-ngl 0`.
