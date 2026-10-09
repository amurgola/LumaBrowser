# LlmRuntimeDetector

`core/llm-server/runtimes/LlmRuntimeDetector.js`

The LLM server's runtime detector. Extends
[RuntimeDetector](../../shared/runtime/RuntimeDetector.md) over
[LlmRuntimeCatalog](LlmRuntimeCatalog.md) for the `inference` kind, and adds
the llama.cpp version parser and the format roll-up (Harmony).

## Methods

- `LlmRuntimeDetector.shared` is the instance over `LlmRuntimeCatalog.shared`.
- `new LlmRuntimeDetector(catalog?)` (default `LlmRuntimeCatalog.shared`).
- `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })`: inherited;
  resolves `{ runtimesRoot, platformKey, runtimes }` with one row per
  inference runtime for this host plus one row per non-inference entry.
- `parseVersionOutput(stdout, stderr)` returns the version label:
  - nested scheme (b10400+): `version: 0.1.0-dev (build 10430, commit 4c1a0af40)`
    -> `b10430 (4c1a0af40)`;
  - flat scheme: `version: 6543 (1234567)` -> `b6543 (1234567)`, `version: b4067` -> `b4067`;
  - argparse noise (`usage:`, `unrecognized arguments`, `invalid choice`,
    `error:`) -> `null`, so a runtime without `--version` (mlx_lm.server) shows
    no version instead of an error line;
  - other output -> its first line; empty -> `null`.

Format rows (`_rollUp`): `{ id, name, kind, description, installed,
providedBy, minLlamaBuild }`. An entry is installed when any installed
`dependsOn` runtime meets `minLlamaBuild`; each such runtime is listed in
`providedBy` as `{ id, version, buildNumber }` (or `{ id, version }` when the
entry has no minimum).

## Why

The managed manifest's release tag (`bNNNN`) is read before `--version`
because some forks (janhq's CUDA builds) report a rebased `version: 1 (hash)`
that would parse as build 1 and wrongly disqualify a current build.
`--version` stays the fallback for PATH and manual runtimes, which have no
manifest. Build numbers come from
[LlamaBuildNumber](../../shared/runtime/detect/LlamaBuildNumber.md).
