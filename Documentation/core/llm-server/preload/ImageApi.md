# ImageApi

`core/llm-server/preload/ImageApi.js`

llmDiagAPI section `image`: the image server (stable-diffusion.cpp) runtimes, models, imports, LoRAs, defaults and lifecycle, one-shot generation, and `image.video` for video generation. Channel shapes mirror the LLM ones.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `image.getEnabled()` | invoke `core.imageServer.getEnabled` |
| `image.setEnabled(enabled)` | invoke `core.imageServer.setEnabled` |
| `image.getRuntimesView(opts)` | invoke `core.imageServer.getRuntimesView` |
| `image.checkRuntimeUpdates()` | invoke `core.imageServer.checkRuntimeUpdates` |
| `image.installRuntime(id)` | invoke `core.imageServer.installRuntime` |
| `image.uninstallRuntime(id)` | invoke `core.imageServer.uninstallRuntime` |
| `image.locateRuntime(id)` | invoke `core.imageServer.locateRuntime` |
| `image.registerRuntimeBinary(id, binaryPath)` | invoke `core.imageServer.registerRuntimeBinary` |
| `image.onRuntimeEvent(cb)` | subscribe `core.imageServer.runtimeEvent` |
| `image.getModelsView()` | invoke `core.imageServer.getModelsView` |
| `image.setModelsDir(dir)` | invoke `core.imageServer.setModelsDir` |
| `image.pickModelsDir()` | invoke `core.imageServer.pickModelsDir` |
| `image.getModelDisplayNames()` | invoke `core.imageServer.getModelDisplayNames` |
| `image.setModelDisplayName(key, name)` | invoke `core.imageServer.setModelDisplayName` |
| `image.setModelKind(modelId, kind)` | invoke `core.imageServer.setModelKind` |
| `image.modelCatalog()` | invoke `core.imageServer.modelCatalog` |
| `image.downloadModel(args)` | invoke `core.imageServer.downloadModel` |
| `image.cancelModelDownload()` | invoke `core.imageServer.cancelModelDownload` |
| `image.removeInstalledModel(id)` | invoke `core.imageServer.removeInstalledModel` |
| `image.updateModelFile(args)` | invoke `core.imageServer.updateModelFile` |
| `image.onModelEvent(cb)` | subscribe `core.imageServer.modelEvent` |
| `image.importModelFromUrl(args)` | invoke `core.imageServer.importModelFromUrl` |
| `image.importModelFromRepo(args)` | invoke `core.imageServer.importModelFromRepo` |
| `image.importModelFromFile(args)` | invoke `core.imageServer.importModelFromFile` |
| `image.pickImportFile()` | invoke `core.imageServer.pickImportFile` |
| `image.scanExistingLibraries(args)` | invoke `core.imageServer.scanExistingLibraries` |
| `image.importExistingModel(args)` | invoke `core.imageServer.importExistingModel` |
| `image.pickLibraryDir()` | invoke `core.imageServer.pickLibraryDir` |
| `image.getPromptProfiles()` | invoke `core.imageServer.getPromptProfiles` |
| `image.listLoras()` | invoke `core.imageServer.listLoras` |
| `image.importLora(args)` | invoke `core.imageServer.importLora` |
| `image.loraCatalog()` | invoke `core.imageServer.loraCatalog` |
| `image.downloadLora(args)` | invoke `core.imageServer.downloadLora` |
| `image.setModelLoras(args)` | invoke `core.imageServer.setModelLoras` |
| `image.getDefaults()` | invoke `core.imageServer.getDefaults` |
| `image.isRoleReady(role)` | invoke `core.imageServer.isRoleReady` |
| `image.setDefaults(payload)` | invoke `core.imageServer.setDefaults` |
| `image.getRamPinStatus()` | invoke `core.imageServer.getRamPinStatus` |
| `image.getAutoUnloadMs()` | invoke `core.imageServer.getAutoUnloadMs` |
| `image.setAutoUnloadMs(ms)` | invoke `core.imageServer.setAutoUnloadMs` |
| `image.getServerStatus()` | invoke `core.imageServer.getServerStatus` |
| `image.startServer()` | invoke `core.imageServer.startServer` |
| `image.stopServer()` | invoke `core.imageServer.stopServer` |
| `image.onServerEvent(cb)` | subscribe `core.imageServer.serverEvent` |
| `image.generate(args)` | invoke `core.imageServer.generate` |
| `image.generateAbort()` | invoke `core.imageServer.generateAbort` |
| `image.onImageEvent(cb)` | subscribe `core.imageServer.imageEvent` |
| `image.video.generate(args)` | invoke `core.videoGen.generate` |
| `image.video.generateAbort()` | invoke `core.videoGen.generateAbort` |
| `image.video.getServerStatus()` | invoke `core.videoGen.getServerStatus` |
| `image.video.stopServer()` | invoke `core.videoGen.stopServer` |
| `image.video.onVideoEvent(cb)` | subscribe `core.videoGen.videoEvent` |
| `image.video.onServerEvent(cb)` | subscribe `core.videoGen.serverEvent` |
