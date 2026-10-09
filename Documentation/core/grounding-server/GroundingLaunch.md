# GroundingLaunch

`core/grounding-server/GroundingLaunch.js`

Builds the grounding llama-server launch. Explicit args, no planner.

## Methods

- `GroundingLaunch.buildArgs({ modelPath, mmprojPath, port, offloadToCpu = false })`
  `-m <model> --mmproj <projector> -ngl 999|0 -c 12288 --image-min-tokens 1024
  --image-max-tokens 8192 --host 127.0.0.1 --port <port> -np 1 --jinja`.
- `GroundingLaunch.requiredBytes(modelPath, mmprojPath)` file sizes plus
  `OVERHEAD_BYTES` (2.5 GiB).
- `GroundingLaunch.plan({ port, modelPath, mmprojPath, runtimeId })` adds `modelName`.
- `async GroundingLaunch.pickRuntime(llmServerService)` the installed
  `llama-cpp*` runtime with a binary, preferring `getDefaults().runtimeId`.
  Throws `No llama.cpp runtime view available.` or `No llama.cpp runtime is
  installed. Install one in the LLM tab first.`
- Statics: `CONTEXT`, `OVERHEAD_BYTES`, `IMAGE_MIN_TOKENS`, `IMAGE_MAX_TOKENS`,
  `HEALTH_TIMEOUT_MS` (3 min), `RUNTIME_ID`.

## Why

The context only has to hold one screenshot (at most about 8k image tokens)
plus a short prompt and a ~64-token answer. llama.cpp warns that
Qwen-VL-family grounding needs at least 1024 image tokens; the cap leaves room
for a zoomed crop. The overhead covers KV, compute buffers and projector
activations for a 9B at that context; it is stated rather than measured so a
placed grounding chip passes the placement gate honestly.
