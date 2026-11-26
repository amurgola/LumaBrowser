# basalt-runtime (manifest.js, main.js)

`extensions/basalt-runtime/manifest.js`, `extensions/basalt-runtime/main.js`

The Basalt runtime add-on: the Basalt engine as an optional LLM runtime, in
two builds the user chooses between, plus its five `.basalt` model packs as
one-click add-on models. Basalt is a C++/CUDA engine with its own Python
server (OpenAI, Anthropic and Responses APIs). Upstream's build needs an
NVIDIA Blackwell card (compute capability 12.0); the LumaByte build also runs
on Ada (8.9) and Ampere (8.6) cards. It runs natively on Windows and Linux
x64; no WSL. `distributable`.

## The two builds

| Row | What it is | Cards |
|---|---|---|
| Basalt LumaByte (RTX 50, RTX 40, RTX 30), `basalt-luma` | [amurgola/basalt](https://github.com/amurgola/basalt) `v0.5.7-luma.1`: upstream 0.5.7, the Ada port and the fork's commits, built for three card generations | An RTX 50, RTX 40 or RTX 30 series card as the only card, the main card or a second card |
| Basalt upstream (RTX 50 only), `basalt` | [jesdga95/basalt](https://github.com/jesdga95/basalt) `v0.5.5`, unmodified | RTX 50 series only |

Both load the same packs. Each row's name carries its card series and its
description starts with its cards, so the Setup tab shows the difference before
an install. See
[BasaltCatalog](BasaltCatalog.md).

## Entry

- `manifest.js`: id `basalt-runtime`, `main: './main.js'`, no dependencies.
- `main.js` exports `{ activate(context), deactivate() }`; `activate` delegates
  to [BasaltActivation](BasaltActivation.md); `deactivate` does nothing because
  the extension manager unregisters everything.

## Flow

1. Activation registers both rows from [BasaltCatalog](BasaltCatalog.md) with
   the [BasaltRuntimeHooks](BasaltRuntimeHooks.md) and the
   [BasaltModelEntries](BasaltModelEntries.md) rows.
2. The runtimes view calls `detect` ([BasaltDetector](BasaltDetector.md)).
3. Install ([BasaltInstaller](BasaltInstaller.md)) refuses a host without a
   card the row's build takes ([BasaltCard](BasaltCard.md)) or a Python 3.10 to 3.13
   ([BasaltPythonFinder](BasaltPythonFinder.md)), then unpacks the row's
   pinned release ([BasaltReleaseArchive](BasaltReleaseArchive.md)), puts the CUDA 13
   libraries beside the binary ([BasaltCudaRuntime](BasaltCudaRuntime.md),
   [BasaltCudaCompanion](BasaltCudaCompanion.md)), builds the server venv
   ([BasaltVenv](BasaltVenv.md)) and writes `manifest.json` (core
   `RuntimeManifest`).
4. Launch is planned synchronously by [BasaltLaunchPlanner](BasaltLaunchPlanner.md)
   (KV through [BasaltKvMode](BasaltKvMode.md), context through
   [BasaltContextSizer](BasaltContextSizer.md)) and supervised by the core LLM
   runtime server through the `openai-compat` chat adapter.
5. Uninstall is core's default: the managed dir holds everything the install wrote.

Paths inside the unpacked archive come from [BasaltLayout](BasaltLayout.md);
core modules load through [CoreRequire](CoreRequire.md).

## What core does with it

- `ModelDirWalker.ADDON_EXTS` maps `.basalt` to kind `basalt`, so packs are
  scanned; the rows' `modelKinds: ['basalt']` makes the Basalt builds their
  only runtimes.
- An add-on model's `requiresRuntime` may list several runtimes (core
  `AddonModelSetup.runtimeIdsOf`): the packs name both builds.
- `HostRuntimeAdvice` reads an id containing `basalt` as a specialised CUDA build.
- `PythonEnvShell.streamCommand` runs the venv's Python without a shell.

## Known limits (recorded rather than worked around)

- Windows output quality is not measured upstream; Linux is where the engine is
  tested and benchmarked.
- Idle sleep (`--idle-sleep`) is Linux only in the upstream build. The LumaByte
  build sleeps on Windows too (the dense Qwen3.8-27B pack only), but the app
  does not use it: its own idle unload stops the process instead.
- The disk conversation tier (`--conversation-cache-disk-mib`) silently skips
  any conversation whose saved state is over 4 GiB; on Windows 0.5.5 it wrote
  nothing in every attempt (2026-11-21).
- A context past 262,144 with YaRN ended the engine on Windows (2026-11-21), so
  the planner never passes rope flags and caps Qwen3.8-27B at 262,144.
- The planner uses one card: the newest generation the build takes, then the
  most VRAM. A second card is used only when the model's extra flags name the
  cards and the mode (`--gpu 0,1 --gpu-mode peer`; Basalt 0.5.7 refuses a list
  without a mode), and an RTX 40 or RTX 30 series card needs the LumaByte build
  (the upstream build refuses it at start). The app's VRAM accounting does not
  know about a second card picked this way.
- An RTX 3090 reads prompts about fourteen times slower than an RTX 5090 with
  Qwen3.8 27B (about 1,050 against 14,000 tok/s, 2026-11-25), and decodes at
  about a third of its speed.
- With an RTX 50 main card and an older second card, Qwen3.8 Flash Next reads
  prompts 15 to 18% slower on `v0.5.7-luma.1` than on `v0.5.6-luma.1`
  (2026-11-25); decode is level.
- Qwen3.8 Flash Next filled an RTX 5090 that also drives the desktop and ended
  with `verify: a device wait timed out` at Basalt's default 700 MiB VRAM
  reserve (2026-11-21); `--vram-reserve-mib 1500` in the model's extra flags
  fixed it. The planner does not pass it.
- `/health` answers 200 at once and reports `loaded: true` when the model is in;
  the core supervisor marks the server ready on the 200, so the first request
  waits inside Basalt while it loads (5 to 6 s for the 27B pack).

## Why

Basalt measured faster than llama.cpp on the RTX 5090 with Qwen3.8-27B (NVFP4
against Q6_K, so the weights differ): about 206 to 279 tok/s drafted decode
against 120 to 149, and 13,400 to 15,400 tok/s prompt reading against 3,000 to
3,500 (2026-11-21). It shipped as an add-on, like NInfer, so users without a
card the add-on runs on never see the row.
