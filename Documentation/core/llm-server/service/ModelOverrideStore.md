# ModelOverrideStore

`core/llm-server/service/ModelOverrideStore.js`

The user's per-model setting overrides, keyed by chat model ref (`local::<stem>` or `<providerId>::<modelId>`) and stored sparse: only the fields the user changed. Extends [SettingsMapStore](SettingsMapStore.md).

## Methods

- `new ModelOverrideStore(settingsDb)`.
- `all()` inherited: a copy of every entry.
- `get(ref)`: the model's cleaned overrides, `{}` when none or for a missing ref.
- `set(ref, overrides)`: replaces the model's overrides with `ModelOverrides.clean(overrides, { launch: isLocal(ref) })` and returns them. An empty result deletes the entry. A missing ref or a `profile::` ref changes nothing and returns `{}`.
- `STORAGE_KEY` `core.llmServer.modelOverrides`.

## Why

Launch fields (the KV cache) only mean something to the managed local server, so a remote model never stores one. A profile keeps its overrides on its own record in [ModelProfileStore](ModelProfileStore.md), never here. The extra launch flags stay in [ModelLaunchFlags](ModelLaunchFlags.md), which the launch planner already reads.
