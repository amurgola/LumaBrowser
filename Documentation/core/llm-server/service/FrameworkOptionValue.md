# FrameworkOptionValue

`core/llm-server/service/FrameworkOptionValue.js`

Normalizes one framework option value before [FrameworkOptions](FrameworkOptions.md) stores or uses it.

## Methods

- `FrameworkOptionValue.normalize(optionId, value, custom?)` returns the value to store, or null when it is not
  valid (the framework's own value is then removed):
  - `null` or `undefined`: null;
  - a custom option (`custom` is its declaration): a toggle takes a boolean (or `'true'` / `'false'`), a choice
    a choice id (as a string);
  - `kvCacheType`: one of `KvCacheModes.MODE_IDS`;
  - `maxConcurrent`: a number of at least 1, floored and capped at `LlmDefaults.MAX_PARALLEL` (64);
  - `openvinoDevice`: `OpenVinoDevice.normalize` (Auto is null);
  - a field of `LlmDefaults.FLAG_FIELDS` (`tensorSplit`, `cacheReuse`, `cpuMoe`, `noMoeGpuCache`, `usePeerGpus`,
    `pinModelRam`): a boolean, or `'true'` / `'false'`;
  - any other id: the value as given.
- `FrameworkOptionValue.fromDefaultsPatch(optionId, value)`: a value written the old way, through the launch
  defaults: a null or empty `kvCacheType` becomes `'f16'`; anything else is returned as given.
- `FrameworkOptionValue.unset(optionId)`: what a known option reads as when a build does not offer it: false for a
  switch, 1 for `maxConcurrent`, null otherwise.

## Why

In the launch defaults a null KV precision means full precision. A framework that stored nothing for it would fall
back to the global default, which may be half precision, so the old null is stored as the framework's own `f16`.

The rules are LlmDefaults' own (its statics, KvCacheModes and OpenVinoDevice), so a value means the same whether
it is global or a framework's. One difference: a framework stores a real `false`, because its own "off" has to
override a global "on", where LlmDefaults stores an off switch as no setting.
