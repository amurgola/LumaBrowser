# SettingValueSpecs

`core/palette/catalog/SettingValueSpecs.js`

How the search palette shows the current value of each catalog setting that carries a settings-database key, keyed by catalog entry id: `{ format, default?, labels?, invert?, unsetText? }` (formats in [SettingValueText](../SettingValueText.md)).

`default` is the value the owning module uses while the key is unset (for example `GpuHeadroom.DEFAULT_BYTES`, `ImageServerSettings.DEFAULT_AUTO_UNLOAD_MS`, `ApprovalPolicy`'s `auto`), so an untouched setting shows what is in effect. A spec without a default shows nothing while unset, used where the app decides at run time (the context length picked per model). `noMoeGpuCache` is stored as an opt-out, so its spec inverts. `llm.vram-warning` (`core.llm.vramWarning`) is stored only as the opt-out `false`, so its spec is `onoff` with `default: true`.

## Drift

A new keyed setting needs a line here.

## Globals

None.

## Framework options (2026-11-22)

The specs of the framework options (`llm.openvino-device`, `llm.kv-cache`, `llm.parallel`, `llm.tensor-split`,
`llm.moe-gpu-cache`, `llm.context-retention`, `llm.peer-gpus`, `llm.ram-pin`) are unchanged: they format the
effective value of the framework that serves the default model, which
[SettingValueReader](../SettingValueReader.md) reads for an entry with a `defaultsField`. `llm.runtime` formats
the build that serves the default model.
