# BasaltCatalog

`extensions/basalt-runtime/BasaltCatalog.js`

The two Basalt builds the add-on offers, each as its own serializable runtime
row with its pinned release and the cards it runs on.

## The builds

| Row id | Name | Release | Cards |
|---|---|---|---|
| `basalt-luma` | Basalt LumaByte (RTX 50 + RTX 30/40 second card) | `amurgola/basalt` `v0.5.6-luma.1` | RTX 50 series main card; an RTX 50, RTX 40 or RTX 30 series second card can hold experts for Qwen3.8 Flash Next |
| `basalt` | Basalt upstream (RTX 50 only) | `jesdga95/basalt` `v0.5.5` | RTX 50 series only, main card and second card |

Each row carries its card series in its name (a collapsed row in the Setup tab
shows little else, and the Runtime picker shows only names), leads its
`description` with `Cards:` and repeats the main-card rule in
`requirementNote`, so the Setup tab says which card series a build supports
before the user installs it.

## Statics

- `HUB` (`{ tag: 'basalt', extension: '.basalt' }`): both rows carry it as `hub`, so the model search offers
  "Basalt packs" once a build is installed and lists the Hub repos tagged `basalt` (core `HubSources`).
- `FRAMEWORK_ID` (`'basalt'`), `FRAMEWORK_NAME` (`'Basalt'`): both rows carry them as `framework` and
  `frameworkName`, so core treats them as two builds of one framework and keeps one active
  (core `RuntimeFrameworks`).
- `UPSTREAM_RUNTIME_ID` (`'basalt'`), `LUMA_RUNTIME_ID` (`'basalt-luma'`).
- `BUILDS`: one object per build: `runtimeId`, `name`, `repo`, `description`,
  `requirementNote` and `release` (`tag` and, per host key, the asset `name`,
  `bytes` and `sha256` GitHub publishes). The LumaByte build is first.
- `RUNTIME_IDS`: the builds' row ids in that order; the pack rows use it as
  their `requiresRuntime`.
- `RUNTIME_ENTRIES`: one row per build: `acquisition: 'extension'`, platforms
  `win32-x64` and `linux-x64`, `requiresHw` (CUDA 13 driver, the Blackwell name
  pattern and its note), `requirementNote`, `protocol: 'openai-compat'`,
  `launchStyle: 'basalt'`, `modelKinds: ['basalt']`, repo, manual source URL,
  `release.tag`.
- `buildFor(runtimeId)`: the build behind a row id, or null.
- `sourceUrl(build)`, `releaseUrl(build)`: the repo and the release page.
- `assetFor(build, platformKey?)`: the host's asset with its
  `releases/download/<tag>/<name>` URL, or null.
- `PLATFORMS`: the host keys both builds publish for.
- `CUDA_RUNTIME_ID` (`'llama-cpp-cuda13'`): the core runtime whose CUDA 13
  libraries the install reuses and whose cudart companion it fetches otherwise.
- `BLACKWELL_NAME_PATTERN`: Blackwell product names (`RTX 50x0`,
  `RTX PRO nnnn ... Blackwell`) as a string, for the hardware pill.
- `BINARY_NAMES`: `basalt.exe` on Windows, `basalt` on Linux.

## Why

Two rows, not one row with a switch, is how the app already offers a patched
build beside the stock one (`llama-cpp-luma` beside `llama-cpp-cuda13`): each
installs into its own managed dir, so both can be installed and the Defaults
picker chooses between them.

The order of `BUILDS` is the preference, in one place: a pack runs on the
first build that is installed, and setting a pack up installs the first build
when none is. The LumaByte build is first because it takes every card the
upstream one does.

The LumaByte build is `amurgola/basalt` `main` (upstream's development branch
plus the fork's commits), built by that repo's release workflow with
`-DPEER_ADA=ON -DPEER_AMPERE=ON`. What was measured with it on an RTX 5090 and
an RTX 3090 (2026-11-22): the second card holding experts raised Qwen3.8 Flash
Next's decode by about a third 240,000 tokens deep and did not help short
conversations, which is why the planner uses the main card alone unless the
model's extra flags name the cards. The RTX 40 series path is upstream's
(`-DPEER_ADA=ON`) and was not run here.

Tags are pinned so an install reproduces the build that was tried; bump one
deliberately with the new sizes and digests. No `request` dialect is declared:
Basalt reads llama.cpp's `chat_template_kwargs` and `reasoning_budget` and
ignores the llama-only sampler fields (`repeat_penalty`, `cache_prompt`)
instead of refusing them. The hardware pill can only match names (core's
`RuntimeHardwareCheck` has no compute-capability rule), so the planner and
installer check the compute capability themselves through
[BasaltCard](BasaltCard.md).

## Options (2026-11-22)

Each row declares the Setup tab options its planner reads (`options`, see
[FrameworkOptionDeclarations](../../core/llm-server/runtimes/FrameworkOptionDeclarations.md)): both builds
`BASE_OPTIONS` (`maxConcurrent`, and `kvCacheType`, which [BasaltKvMode](BasaltKvMode.md) maps). The LumaByte
build adds `SLEEP_OPTIONS`:

- `idleSleep` ("Sleep when idle"), a choice of `off` (`IDLE_SLEEP_OFF`, the default), `60`, `300` and `900`: the
  ids are the seconds [BasaltLaunchPlanner](BasaltLaunchPlanner.md) passes as `--idle-sleep`.
- `keepSleepRam` ("Keep sleep memory"), a toggle, default off: `--keep-sleep-ram`.

Both carry `ramNote: 'sleep'`, so core adds the RAM a sleep would hold against the free RAM
([SleepRamNote](../../core/llm-server/service/SleepRamNote.md)). The upstream build has no sleep that gives the
VRAM back on Windows, so it declares neither. `_runtimeEntry` copies `options` so a row never shares the build's
arrays.
