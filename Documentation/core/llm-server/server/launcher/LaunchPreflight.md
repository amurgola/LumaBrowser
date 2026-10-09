# LaunchPreflight

`core/llm-server/server/launcher/LaunchPreflight.js`

Resolves the persisted defaults into an installed runtime, a scanned model and
the launch API key, or into a refusal.

## Methods

- `new LaunchPreflight({ diagnostics, detector, scanner, catalog })`.
- `resolve(ctx, timings)` fills `ctx.diag`, `runtimeRow`, `runtime`, `model`,
  `launchKey` and returns null, or returns the first refusal:
  1. `Runtime <id> not found in detector view.`
  2. `Runtime <name> is not installed.` with `code: 'RUNTIME_NOT_INSTALLED'`,
     `runtimeId`, `runtimeName`, `installable` (the row's own flag, else: the
     catalog entry is `inference`, not `manual-source`, and has an asset pattern);
  3. `Runtime <name> has no usable binary.`
  4. `Default model path no longer matches a scanned model.`
  5. [ModelRuntimeMatch](ModelRuntimeMatch.md);
  6. API security on with no key: `API security is enabled but no keys exist. ...`

  `timings.diag`, `.runtimes` and `.scan` receive timestamps for the preflight log line.

Diagnostics come from `service.ensureDiagnostics()` when present, else
`diagnostics.gather({ savedNvidiaSmiPath })`; the runtimes view from
`service.ensureRuntimesView()`, else `detector.detectRuntimes(...)`. The runtime
gets `UnsupportedFlagMemory.withLearnedFlags`.

## Why

The persisted caches are what every Setup card reads; fresh probes cost seconds
per launch and bought nothing. The direct probes keep bare test fixtures working.
