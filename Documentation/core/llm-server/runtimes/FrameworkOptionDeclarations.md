# FrameworkOptionDeclarations

`core/llm-server/runtimes/FrameworkOptionDeclarations.js`

The options a runtime build declares for its framework, from its catalog entry's `options` or a default set.

## Methods

- `FrameworkOptionDeclarations.of(entry)`: `[{ id, custom }]`. `custom` is null for a known option, else
  `{ label, caption, help, kind, choices, default, ramNote }`.
  - Declared: `entry.options` is an array of known ids (`KNOWN_IDS`: `kvCacheType`, `maxConcurrent`,
    `tensorSplit`, `noMoeGpuCache`, `cacheReuse`, `usePeerGpus`, `pinModelRam`, `openvinoDevice`) and custom
    objects `{ id, label, caption, help, kind: 'toggle' | 'choice', choices: [{ id, label }], default, ramNote? }`.
    An unknown string, a custom object that reuses a known id, an unknown kind or a choice without choices is
    dropped. A toggle's default is `default === true`; a choice's default must be one of its choice ids, else the
    first. Choice ids become strings.
  - Not declared: a llama.cpp style entry (no `modelKinds`, not `launchStyle: 'mlx-server'`) gets `kvCacheType`,
    `maxConcurrent`, `noMoeGpuCache`, `usePeerGpus`, `pinModelRam`, plus `tensorSplit` for
    `RuntimeFlags.TENSOR_SPLIT_RUNTIME_IDS`, `cacheReuse` unless `unsupportedFlags` holds `--cache-reuse`, and
    `openvinoDevice` for `llama-cpp-openvino`. Any other entry gets `maxConcurrent`.
- `FrameworkOptionDeclarations.customOf(entries, optionId)`: the custom declaration of that id among some entries
  (a framework's builds), or null.

## Why

A known option needs no copy: the Setup tab already has its label, help and control. A custom one is drawn
generically from its declaration, so an add-on can offer an option of its own engine without UI code. The default
set is what each kind of planner really reads, so a build that says nothing still shows only options that matter.
