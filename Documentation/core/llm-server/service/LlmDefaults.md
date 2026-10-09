# LlmDefaults

`core/llm-server/service/LlmDefaults.js`

The persisted LLM launch defaults. Extends [KeyedSettings](KeyedSettings.md).

## Methods

- `new LlmDefaults({ settingsDb, launchFlags, groupRouter })`; `launchFlags` is
  [ModelLaunchFlags](ModelLaunchFlags.md), `groupRouter` has `isEnabled`,
  `isPinEnabled`, `setEnabled`, `setPinEnabled`.
- `get()` returns
  `{ runtimeId, modelPath, contextSize, kvCacheType, maxConcurrent, tensorSplit, cacheReuse, cpuMoe, noThink, reasoningEffort, usePeerGpus, pinModelRam, groupRouter, groupRouterPinRam, launchFlags }`:
  - `contextSize` a floored positive number, else null (the planner's own default);
  - `kvCacheType` one of `KvCacheModes.MODE_IDS`, else null;
  - `maxConcurrent` 1 to 64 (`DEFAULT_PARALLEL`, `MAX_PARALLEL`), else 1;
  - the six `FLAG_FIELDS` booleans, off by default;
  - `reasoningEffort` `ReasoningEffort.normalizeEffort` of the stored level (`'default'` when none);
  - `groupRouter`, `groupRouterPinRam` from the router;
  - `launchFlags` the current default model's flags, `''` when none.
- `set(patch)` changes only the fields present (undefined is a no-op) and
  returns `get()`:
  - ids stored as strings, a falsy id deletes;
  - `contextSize` floored when positive, else deleted; `kvCacheType` kept only
    when known; `maxConcurrent` floored and capped at 64 when at least 1, else deleted;
  - flags store `true` or delete;
  - `reasoningEffort` normalized, `'default'` (and garbage) deletes;
  - `groupRouter`, `groupRouterPinRam` forwarded to the router's setters;
  - `launchFlags` stored for whichever model is the default after this save
    (dropped when none), so switching model and typing flags in one save lands on the new model.
- Statics: `KEYS` (every `core.llmServer.defaults.*` key, never renamed),
  `ID_FIELDS`, `FLAG_FIELDS`, `DEFAULT_PARALLEL`, `MAX_PARALLEL`.

## Why

Every field is intent only: the launch planner gates tensor split, cache reuse
and CPU MoE per model and runtime, the chat router applies noThink and the
effort, RamPinService gates the pin. The slot count is clamped on read so a bad
persisted value cannot ask for thousands of slots.
