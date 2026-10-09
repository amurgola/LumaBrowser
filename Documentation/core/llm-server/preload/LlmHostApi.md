# LlmHostApi

`core/llm-server/preload/LlmHostApi.js`

llmDiagAPI section: host diagnostics and fixes, the models directory and existing libraries, model display names, the boot preflight, the VRAM pressure watchdog and the Linux system-library check.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `getDiagnostics(options)` | invoke `core.llmServer.getDiagnostics` |
| `addNvidiaSmiToPath(directory)` | invoke `core.llmServer.addNvidiaSmiToPath` |
| `dismissNvidiaSmiPathHint()` | invoke `core.llmServer.dismissNvidiaSmiPathHint` |
| `recoverDisplayDevice(instanceId)` | invoke `core.llmServer.recoverDisplayDevice` |
| `setPcieAspmOff()` | invoke `core.llmServer.setPcieAspmOff` |
| `getModelsView()` | invoke `core.llmServer.getModelsView` |
| `setModelsDir(directory)` | invoke `core.llmServer.setModelsDir` |
| `pickModelsDir()` | invoke `core.llmServer.pickModelsDir` |
| `getStorageInfo()` | invoke `core.llmServer.getStorageInfo` |
| `scanExistingLibraries()` | invoke `core.llmServer.scanExistingLibraries` |
| `importExistingModel(args)` | invoke `core.llmServer.importExistingModel` |
| `pickDirectory(opts)` | invoke `core.llmServer.pickDirectory` |
| `getModelDisplayNames()` | invoke `core.llmServer.getModelDisplayNames` |
| `setModelDisplayName(key, name)` | invoke `core.llmServer.setModelDisplayName` |
| `getPreflight()` | invoke `core.llmServer.getPreflight` |
| `getVramPressure()` | invoke `core.llmServer.getVramPressure` |
| `dismissVramPressure(card)` | invoke `core.llmServer.dismissVramPressure` |
| `getUnloadOnVramPressure()` | invoke `core.llmServer.getUnloadOnVramPressure` |
| `setUnloadOnVramPressure(v)` | invoke `core.llmServer.setUnloadOnVramPressure` |
| `checkSystemLibraries()` | invoke `core.llmServer.checkSystemLibraries` |
