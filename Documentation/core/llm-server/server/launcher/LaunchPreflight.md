# LaunchPreflight

`core/llm-server/server/launcher/LaunchPreflight.js`

Resolves the persisted defaults into a scanned model, the installed runtime that
serves it and the launch API key, or into a refusal.

## Methods

- `new LaunchPreflight({ diagnostics, detector, scanner, catalog, gpuReady? })`;
  `gpuReady()` defaults to `CudaDeviceProbe.whenReady(GPU_READY_MS)` (3 s).
- `resolve(ctx, timings)` fills `ctx.diag`, then awaits `gpuReady()` (bounded)
  so a launch right after boot waits for the nvidia-smi stream's first reading
  instead of placing as if there were no cards, then fills `model`,
  `runtimeRow`, `runtime`, `launchKey` and returns null, or returns the first refusal:
  1. `Default model path no longer matches a scanned model.`
  2. no runtime on this host loads the model's format (or the model is a
     projector or draft head alone): `No framework on this PC loads <name>
     (<format> format). ...` with `code: ModelRuntimeMatch.CODE`;
  3. builds load it but none is installed: `Runtime <name> is not installed.` with
     `code: 'RUNTIME_NOT_INSTALLED'`, `runtimeId`, `runtimeName`, `installable` (the
     row's own flag, else: the catalog entry is `inference`, not `manual-source`, and
     has an asset pattern) for the build the resolver names to install;
  4. that build is installed without a binary: `Runtime <name> has no usable binary.`
  5. API security on with no key: `API security is enabled but no keys exist. ...`

  `timings.diag`, `.scan` and `.runtimes` receive timestamps for the preflight log line.

The runtime is `ctx.service.runtimeChooser.forModel(model, { runtimesView,
diagnostics })` ([RuntimeChooser](../../service/RuntimeChooser.md)), so the model
decides it, not the stored `defaults.runtimeId`; the resolver already applies
[ModelRuntimeMatch](ModelRuntimeMatch.md) to every candidate row. When the chosen
runtime differs from `ctx.defaults.runtimeId`, the preflight stores it with
`service.setDefaults({ runtimeId })` (when the service has one) and reads
`ctx.defaults` again, so the request adapter and the status lines see the runtime
that really starts and the option values are the serving framework's.

Diagnostics come from `service.ensureDiagnostics()` when present, else
`diagnostics.gather({ savedNvidiaSmiPath })`; the runtimes view from
`service.ensureRuntimesView()`, else `detector.detectRuntimes(...)`. The runtime
gets `UnsupportedFlagMemory.withLearnedFlags`.

## Why

The persisted caches are what every Setup card reads; fresh probes cost seconds
per launch and bought nothing. The direct probes keep bare test fixtures working.
Picking the runtime from the model means a GGUF picked while a Basalt pack was the
default (or the reverse) just starts on the right engine instead of being refused
as a runtime mismatch.
