# IkLlamaCatalog

`extensions/ik-llama-runtime/IkLlamaCatalog.js`

The serializable ik_llama.cpp runtime rows. They cross IPC to the Setup tab and
are folded into the runtime-catalog fingerprint.

## Methods

- `IkLlamaCatalog.buildRuntimeEntries({ platform?, isa? })` returns the rows for
  the host (default `process.platform` and [HostIsa](HostIsa.md)`.detect`),
  dropping rows whose `platforms` exclude it: `ik-llama-cuda13`,
  `ik-llama-cuda12` (win32, linux), `ik-llama-vulkan` (linux), `ik-llama-cpu`
  (win32, linux, darwin; the darwin description says the Apple Silicon build
  uses Metal). Every row has `kind: 'inference'`, `acquisition: 'github-release'`,
  the Thireus repo, llama.cpp binary names, `protocol: 'openai-compat'`,
  `optional: true`, the manual-source URL and note, copies of
  `UNSUPPORTED_FLAGS` and `EXTRA_ARGS`, `skipFeatures: []`,
  `nativeQuantPattern`, `specDialect: 'ik'`, `buildVariant: { isa, feed }`, and
  asset/companion regexes from [IkLlamaAssetPatterns](IkLlamaAssetPatterns.md).
- Statics: `BUILD_REPO` (`Thireus/ik_llama.cpp`), `UPSTREAM_URL`,
  `UNSUPPORTED_FLAGS`, `EXTRA_ARGS`, `NATIVE_QUANT_PATTERN`,
  `MANUAL_SOURCE_NOTE`, `LLAMA_BIN_NAMES`, `FORK_BLURB`.

## Why

ikawrakow/ik_llama.cpp publishes no binaries; Thireus's fork builds every
upstream commit. Its tag `main-b<build>-<sha>` parses as llama.cpp build
`<build>`, so the update check works as for ggml-org builds.

`UNSUPPORTED_FLAGS` was measured against Thireus main-b5197-1fb759f
(2026-08-25) by diffing every flag the planner and fit test emit against
`llama-server --help`: `--swa-full`, `--cache-reuse`, `--spec-draft-n-max` and
`--reasoning-preserve` are absent (the last one made the in-app launch exit 1
with the help text on Qwen3.8-27B). `--spec-type` exists in the fork's own
grammar, hence `specDialect: 'ik'`. `--flash-attn on|off` is accepted, which is
what lets the fit test run. Drop entries as the fork catches up.

`EXTRA_ARGS` (`--no-warmup`) skips the empty-prompt warmup, cheap insurance
against backend-init crashes on partially implemented architectures; with it
b5197 loads the Qwen3.8-27B vision projector.

`NATIVE_QUANT_PATTERN` claims ik-only quantizations (`IQ<n>_K`, `_KS`, `_KSS`,
`_KT`, and any `_R4`/`_R8` repack) so the scanner lists these rows as a model's
preferred runtimes; mainline names (`Q4_K_M`, `IQ4_XS`, `IQ4_NL`) do not match.
