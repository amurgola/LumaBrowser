# DefaultsCardHtml

`core/llm-server/ui/js/setup-ui/defaults/DefaultsCardHtml.js`

The Defaults card body and all its help copy.

## Methods

- `html(rows, view)`; `HELP` (every "?" explanation). When `view.openvino` is set, an "OpenVINO device" segmented row (`defaultOpenVinoDevice`, help `HELP.openvinoDevice`) follows the runtime select.
- The switch grid leads with "MoE GPU cache" (`defaultMoeGpuCache`, checked unless `noMoeGpuCache`, help `HELP.moeGpuCache`). The fold's segmented rows include "GPU headroom" (`defaultGpuHeadroom`, 1 to 4 GB, help `HELP.gpuHeadroom`) when the preload reads it.
- The switch rows after "Auto-unload" are "Low VRAM warning" (`defaultVramWarning`, checked from `prefs.vramWarning`, help `HELP.vramWarning`) and "Unload on VRAM pressure" (`defaultUnloadOnVramPressure`, help `HELP.vramPressure`), each only when the preload reads it (the pref is not null). `HELP.gpuHeadroom` explains that a model that fits whole on one card only inside half the headroom still loads there; `HELP.vramPressure` that the warning starts under the headroom and the unload under half of it.
- With a default model, the "More settings" fold ends with a "This model only" row: a "Tune this model…" button (`data-tune-model="local::<stem>"`, help `HELP.tune`) that opens the per-model Tune dialog. Extra llama.cpp flags are edited there now, not in the card.

## Globals

None (FoldMemory reads `localStorage`).

## Changes (2026-11-09, helper model)

`_helperRows(rows, v)` under More settings when `v.helperAvailable` and the defaults carry `helperModel`: the `defaultHelperModel` toggle with the `helperModelHint` caption, and while it is on the `defaultHelperModelSelect` file row (`v.helperModelOptions`, the whole library) and the `defaultHelperContext` window row. Help texts `helperModel`, `helperModelFile`, `helperContext`.

## Changes (2026-11-22, framework refactor)

The Runtime select, the OpenVINO device row, KV precision, concurrent predictions and the framework switches (tensor split, MoE GPU cache, context retention, peer GPUs, RAM pin) left the card; `runsOnLine(runsOn)` draws the line under the Model row (`#defaultsRunsOn`, `.defaults-runs-on`, `.is-missing` in the warning colour). `HELP` keeps the help copy of the framework options, which [FrameworkOptionRows](../frameworks/FrameworkOptionRows.md) reads; `lockedModel` is gone. The gate note now reads "Chat needs a default model. Pick one above." and shows only without a model.
