# ModelLaunchFlags

`core/llm-server/service/ModelLaunchFlags.js`

The user's extra llama-server flags per local model, keyed by model file stem
and stored as typed. Extends [ModelTextOverrides](ModelTextOverrides.md).

## Methods

- `new ModelLaunchFlags(settingsDb)`.
- `all()`, `get(stem)`, `set(stem, text)` inherited (blank clears).
- `resolve(modelPathOrStem)` the flags for a weights path or a bare stem (keyed
  by `ModelName.key`, so any path ending in the same file matches); `''` when none.
- `setForModel(modelPath, text)` `set(ModelName.key(modelPath), text)`.
- `STORAGE_KEY` `core.llmServer.modelLaunchFlags`.

## Why

The launch planner splits the text shell-style ([UserArgs](../server/UserArgs.md))
and appends it after its own flags, so a repeated flag wins. The ServerLauncher
reads `resolveModelLaunchFlags` for the default model at every start.
