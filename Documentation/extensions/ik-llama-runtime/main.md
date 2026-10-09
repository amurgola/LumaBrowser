# ik-llama-runtime (manifest.js, main.js)

`extensions/ik-llama-runtime/manifest.js`, `extensions/ik-llama-runtime/main.js`

The ik_llama.cpp runtime add-on: adds ikawrakow's llama.cpp fork (CUDA 13, CUDA 12,
Vulkan, CPU) as optional LLM runtime rows. `private` and `distributable`, so it
ships as a standalone add-on zip.

## Entry

- `manifest.js` keeps the legacy id, fields and text; `main: './main.js'`, no
  dependencies (it uses `context.llmCatalog`, which every extension receives).
- `main.js` exports `{ activate(context), deactivate() }`. `activate` delegates to
  [IkLlamaActivation](IkLlamaActivation.md) and resolves `{}`; `deactivate` does
  nothing because the extension manager unregisters the rows.

## Why no hooks

ik_llama speaks llama-server's CLI and HTTP surface, so its rows carry
`acquisition: 'github-release'` plus per-host asset regexes and register no
hooks. The core detector, installer, update check, launch planner, fit test and
VRAM coordinator treat them like the built-in llama.cpp rows; the fork's CLI
differences ride on `unsupportedFlags`, `skipFeatures`, `extraArgs` and
`specDialect`. None of the runtime base classes (RuntimeInstaller,
RuntimeDetector, BaseRuntimeServer) is subclassed: core runs these rows itself.

An installed copy keeps its files in `<runtimes>/<id>/` after the extension is
disabled but drops out of the runtime list until it is enabled again.
