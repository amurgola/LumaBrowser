# NinferLaunchPlanner

`extensions/ninfer-runtime/NinferLaunchPlanner.js`

The synchronous `planLaunch` hook: the ninfer-serve argv plus the plan object
the router, Setup UI and context estimator read.

## Methods

- `NinferLaunchPlanner.plan({ model, runtime, port, overrides?, apiKey?, diagnostics? })`
  returns `{ binaryPath, args, plan, authKey, cudaDevice, healthTimeoutMs }`.
  - Throws `ninfer planLaunch: model is required`, `runtime has no binaryPath`,
    `model has no weight path` or `port is required`.
  - Mode is `runtime.manifest.mode`, else the host's. In WSL mode the weight
    path becomes `/mnt/<drive>/...`.
  - Context: `overrides.contextSize`, else the add-on's `defaultContextSize`
    (131072), clamped to `contextLength` (262144) and fitted by
    [NinferContextSizer](NinferContextSizer.md) on the
    [NinferDevicePicker](NinferDevicePicker.md) device.
  - Concurrency: `overrides.maxConcurrent` clamped to 1..8, default 1.
  - Serve args: artifact, `--model-id <sidecar modelId or 'ninfer'>`, `--host`
    (`0.0.0.0` in WSL, loopback natively), `--port`, `--max-context` and
    `--kv-capacity` (both the context), `--max-concurrency`, `--spec mtp
    --draft-tokens 3 --lm-head-draft`, `--api-key` when set, then `runtime.extraArgs`.
  - WSL: `binaryPath` is wsl.exe, args `[-d <distro>] -- bash -lc "exec [env
    CUDA_VISIBLE_DEVICES=<i>] <bin> <args...>"` (POSIX-quoted), `cudaDevice: null`.
    Native: the binary and args directly, `cudaDevice` the picked index as a string.
  - `healthTimeoutMs`: 20 min for a WSL launch reading a `/mnt/` path (9p
    mount), else 8 min.
  - `plan` carries the llama.cpp plan keys (`contextSize`,
    `requestedContextSize`, `cacheTypeK/V: 'int8'`, `fullOffload`,
    `singleGpu`, `mtp`, `maxConcurrent`, `ctxPerSlot`, `vramAvailableBytes`,
    `modelEstimatedBytes`, `perGpu`, ...) plus `apiModelName`, `ninfer: true`,
    `mode`, `distro`, `host`, `processPattern: 'ninfer-serve'`, `cudaDevice` and
    `notes` (sizing note, runtime, model, context, GPU, auth).

## Why

NInfer rejects a chat request whose `model` differs from its public id, so the
id is pinned at launch and published as `plan.apiModelName` for the chat
adapter. `--kv-capacity` is explicit because `auto` trips NInfer's CUDA-graph
allowance planner at 131K and above (measured 2026-08-26). Pinning in WSL
happens inside the command because Windows-side env never crosses into the VM.
`0.0.0.0` inside the VM lets the supervisor's distro-IP fallback reach the
server when localhost forwarding is off.
