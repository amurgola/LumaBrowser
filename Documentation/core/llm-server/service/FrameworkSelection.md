# FrameworkSelection

`core/llm-server/service/FrameworkSelection.js`

The user's standing choices between ways to run a model.

## Methods

- `new FrameworkSelection(settingsDb, { pins? })`.
- `activeBuild(frameworkId)` / `setActiveBuild(frameworkId, runtimeId)`: the runtime id chosen as a framework's
  active build. Key `core.llmServer.frameworks.<frameworkId>.activeBuild`.
- `formatFramework(format)` / `setFormatFramework(format, frameworkId)`: the default framework for a format that
  several load. Key `core.llmServer.formats.<format>.framework`.
- `modelFramework(pathOrStem)` / `setModelFramework(modelPath, frameworkId)`: the framework one model is pinned
  to ([ModelFrameworkPins](ModelFrameworkPins.md)).
- Every getter returns null where no choice is stored; a setter given null or an empty string deletes the key.

## Why

"No choice" is a value of its own: [ModelRuntimeResolver](../runtimes/ModelRuntimeResolver.md) then falls back
to the old single setting and the host's preference, so nothing is written for a user who never opens Setup.
The keys are per framework and per format so a new framework from an extension needs no schema.
