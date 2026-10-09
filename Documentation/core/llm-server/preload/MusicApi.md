# MusicApi

`core/llm-server/preload/MusicApi.js`

llmDiagAPI section `music`: the managed SGLang-Omni music server (inside WSL2 on Windows) runtime, models, defaults and status, and `music.gen` for generation.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `music.getView(opts)` | invoke `core.musicServer.getView` |
| `music.getWslStatus()` | invoke `core.musicServer.getWslStatus` |
| `music.installRuntime(id)` | invoke `core.musicServer.installRuntime` |
| `music.cancelInstall()` | invoke `core.musicServer.cancelInstall` |
| `music.uninstallRuntime(id)` | invoke `core.musicServer.uninstallRuntime` |
| `music.checkRuntimeUpdates(opts)` | invoke `core.musicServer.checkRuntimeUpdates` |
| `music.getModelsView()` | invoke `core.musicServer.getModelsView` |
| `music.downloadModel(modelId)` | invoke `core.musicServer.downloadModel` |
| `music.cancelDownload()` | invoke `core.musicServer.cancelDownload` |
| `music.deleteModel(modelId)` | invoke `core.musicServer.deleteModel` |
| `music.getDefaults()` | invoke `core.musicServer.getDefaults` |
| `music.setDefaults(patch)` | invoke `core.musicServer.setDefaults` |
| `music.setEnabled(enabled)` | invoke `core.musicServer.setEnabled` |
| `music.getStatus()` | invoke `core.musicServer.getStatus` |
| `music.stopServer()` | invoke `core.musicServer.stopServer` |
| `music.onRuntimeEvent(cb)` | subscribe `core.musicServer.runtimeEvent` |
| `music.onModelEvent(cb)` | subscribe `core.musicServer.modelEvent` |
| `music.gen.generate(args)` | invoke `core.musicGen.generate` |
| `music.gen.generateAbort()` | invoke `core.musicGen.generateAbort` |
| `music.gen.getServerStatus()` | invoke `core.musicGen.getServerStatus` |
| `music.gen.stopServer()` | invoke `core.musicGen.stopServer` |
| `music.gen.onMusicEvent(cb)` | subscribe `core.musicGen.musicEvent` |
| `music.gen.onServerEvent(cb)` | subscribe `core.musicGen.serverEvent` |
