# LlmFrameworks

`core/llm-server/ipc/LlmFrameworks.js`

The Setup tab's frameworks section: the view and the user's choices in it.

## Methods

- `new LlmFrameworks({ llmServerService })`.
- `view()`: `{ view }`, a [FrameworksView](../runtimes/FrameworksView.md) with `current` from
  `runtimeFollower.resolve()` and options from `frameworkOptions.describe` when the store has it.
- `setActiveBuild(frameworkId, runtimeId)`, `setFormatFramework(format, frameworkId)`,
  `setModelFramework(modelPath, frameworkId)`: store the choice (null clears it), follow the default runtime
  ([DefaultRuntimeFollower](../service/DefaultRuntimeFollower.md)) and resolve `{ view, serverStopped }`. The
  loaded model is stopped only when the choice moved the default model to another runtime and the server is not idle.
- `setOption(frameworkId, optionId, value)`: stores one option value for that framework (null removes it) and
  stops the loaded model only when that framework serves the default model.

IPC: `core.llmServer.getFrameworksView`, `setActiveBuild`, `setFormatFramework`, `setModelFramework`,
`setFrameworkOption` (registered in `LlmServerIpcHandlers._registerRuntimes`).

## Why

A choice that does not change what serves the loaded model must not interrupt it: activating another Basalt
build while a GGUF is loaded changes nothing that is running.
