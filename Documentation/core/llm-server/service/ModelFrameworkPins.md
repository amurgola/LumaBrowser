# ModelFrameworkPins

`core/llm-server/service/ModelFrameworkPins.js`

The framework a local model is pinned to, keyed by model file stem.

## Methods

- `new ModelFrameworkPins(settingsDb)`: a `ModelTextOverrides` map under `core.llmServer.modelFrameworks`.
- `resolve(modelPathOrStem)`: the pinned framework id, `''` when none. A path and a bare stem give the same entry.
- `setForModel(modelPath, frameworkId)`: stores it; a blank id removes the pin.

## Why

A pin only matters where two frameworks load one format (a GGUF meant for ik_llama.cpp beside llama.cpp). It is
keyed by stem like the other per-model maps, so it survives moving the models folder.
