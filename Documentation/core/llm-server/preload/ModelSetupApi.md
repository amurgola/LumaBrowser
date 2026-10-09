# ModelSetupApi

`core/llm-server/preload/ModelSetupApi.js`

llmDiagAPI section: the onboarding catalog, Hugging Face search, hardware and recommendation, Automatic Local Setup, resumable model downloads (progress on onModelEvent) and extension add-on models.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `modelCatalog()` | invoke `core.llmServer.modelCatalog` |
| `modelCatalogLive(opts)` | invoke `core.llmServer.modelCatalogLive` |
| `searchModels(args)` | invoke `core.llmServer.searchModels` |
| `expandModelRepo(repoId, opts)` | invoke `core.llmServer.expandModelRepo` |
| `getModelReadme(repoId)` | invoke `core.llmServer.getModelReadme` |
| `getWizardHardware()` | invoke `core.llmServer.getWizardHardware` |
| `recommendModel(answers)` | invoke `core.llmServer.recommendModel` |
| `planAutoSetup(opts)` | invoke `core.llmServer.planAutoSetup` |
| `setEnabled(v)` | invoke `core.llmServer.setEnabled` |
| `setOpenTabOnLoad(v)` | invoke `core.llmServer.setOpenTabOnLoad` |
| `downloadModel(args)` | invoke `core.llmServer.downloadModel` |
| `cancelModelDownload()` | invoke `core.llmServer.cancelModelDownload` |
| `pauseModelDownload()` | invoke `core.llmServer.pauseModelDownload` |
| `onModelEvent(cb)` | subscribe `core.llmServer.modelEvent` |
| `addonModelCatalog()` | invoke `core.llmServer.addonModelCatalog` |
| `setupAddonModel(id)` | invoke `core.llmServer.setupAddonModel` |
| `cancelAddonSetup()` | invoke `core.llmServer.cancelAddonSetup` |
| `onAddonEvent(cb)` | subscribe `core.llmServer.addonEvent` |
