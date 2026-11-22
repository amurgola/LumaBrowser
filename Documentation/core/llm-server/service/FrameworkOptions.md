# FrameworkOptions

`core/llm-server/service/FrameworkOptions.js`

Launch options kept per framework, over the one global set of defaults, plus the Setup tab's description of the
options a framework's active build declares.

## Methods

- `new FrameworkOptions(settingsDb, { catalog?, globalDefaults?, sleepNote? })`. `catalog` (`getById`,
  `getCatalog`) is where builds declare their options; without one a row's own `options` are read.
  `globalDefaults()` returns the raw global [LlmDefaults](LlmDefaults.md). `sleepNote` is a
  [SleepRamNote](SleepRamNote.md). [LLMServerService](../LLMServerService.md) wires all three in
  `_createFrameworkStores`.
- `values(frameworkId)`: the framework's own stored values `{ optionId: value }`, `{}` when none (a copy). Key
  `core.llmServer.frameworks.<frameworkId>.options`.
- `set(frameworkId, optionId, value)`: stores one value normalized by
  [FrameworkOptionValue](FrameworkOptionValue.md), with the custom declaration of that id from any build of the
  framework in the catalog. `null`, `undefined` or an invalid value removes the framework's own value; the last
  one removed deletes the key. Returns the values after the change.
- `overlay(defaults, frameworkId)`: the defaults with the framework's own values of `DEFAULT_FIELDS` on top.
- `describe(framework, activeBuildRow)`: one entry per option the build declares
  ([FrameworkOptionDeclarations](../runtimes/FrameworkOptionDeclarations.md), the catalog entry read by
  `activeBuildRow.id`):
  - known: `{ id, value, own }`, `value` the framework's own value, else the global default (null when unset);
  - custom: `{ id, value, own, custom: { label, caption, help, kind, choices, default }, note }`, `value` the
    own value, else the declared default; `note` is `sleepNote.noteFor(activeBuildRow)` for a declaration with
    `ramNote: 'sleep'`, else null.
- `launchValues(buildRow)`: `{ optionId: value }` for the custom options the build declares, declared defaults
  included; what [LaunchOverrides](../server/launcher/LaunchOverrides.md) hands planners as
  `overrides.frameworkOptions`.
- `DEFAULT_FIELDS`: the LlmDefaults fields that belong to a framework: `kvCacheType`, `maxConcurrent`,
  `tensorSplit`, `cacheReuse`, `cpuMoe`, `noMoeGpuCache`, `usePeerGpus`, `pinModelRam`, `openvinoDevice`.
- `declaredOnly(defaults, buildRow)`: the launch defaults with every known option that build does not declare
  switched off (`FrameworkOptionValue.unset`). `LaunchOverrides` applies it for the resolved runtime, so a setting
  made for one framework (tensor split for llama.cpp, which also forces full precision KV) never shapes the launch
  of another.

## Why

A KV precision or slot count chosen for llama.cpp is wrong for Basalt, so each framework keeps its own, and an
unset one still reads as the setting the app had before frameworks. The catalog is read by id because the
detected rows do not carry `options`. A custom value is checked against any build of the framework, so a value set
while one build is active survives switching to its sibling; a stored value the declaration no longer accepts
reads as the declared default instead of reaching a planner. An option id no loaded build declares is stored as
given, so the value of an add-on that is not loaded yet is kept.
