# LlmRuntimeApi

`core/llm-server/preload/LlmRuntimeApi.js`

llmDiagAPI section: the LLM inference runtimes (install, update check, uninstall, locate a binary) with their progress stream, and openExternal for the runtime cards' upstream links.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `getRuntimesView(opts)` | invoke `core.llmServer.getRuntimesView` |
| `checkRuntimeUpdates()` | invoke `core.llmServer.checkRuntimeUpdates` |
| `installRuntime(id, opts)` | invoke `core.llmServer.installRuntime` |
| `getRuntimePrerelease(id)` | invoke `core.llmServer.getRuntimePrerelease` |
| `uninstallRuntime(id)` | invoke `core.llmServer.uninstallRuntime` |
| `pickRuntimeBinary(id)` | invoke `core.llmServer.pickRuntimeBinary` |
| `registerRuntimeBinary(id, binaryPath)` | invoke `core.llmServer.registerRuntimeBinary` |
| `locateRuntime(id)` | invoke `core.llmServer.locateRuntime` |
| `onRuntimeEvent(cb)` | subscribe `core.llmServer.runtimeEvent` |
| `openExternal(url)` | invoke `core.shell.openExternal` |
