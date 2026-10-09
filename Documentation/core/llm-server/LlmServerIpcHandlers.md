# LlmServerIpcHandlers

`core/llm-server/LlmServerIpcHandlers.js`

IPC controller for the LLM server and the chat (`core.llmServer.*`, plus
`core.debug.getLogs`). Routes only; the work lives in the services under
[ipc/](ipc/), the [chat router](chat/UnifiedChatRouter.md) and
[LLMServerService](LLMServerService.md).

## Methods

- `LlmServerIpcHandlers.register(llmServerService, deps)` builds the
  [UnifiedChatRouter](chat/UnifiedChatRouter.md) (which publishes itself as
  `global.__lumaChatRouter`), wires [LlmServerBroadcast](ipc/LlmServerBroadcast.md)
  and [LlmAvailability](ipc/LlmAvailability.md) to the supervisor, registers the
  170 channels below on `ipcMain` (168 without `deps.artifactDataStore`; the legacy 169 plus `liveApi.extCall`) and
  returns `{ router }`.
- `deps` is what main.js passes, wrapped in [LlmIpcDeps](ipc/LlmIpcDeps.md):
  `db`, `getAgentDeps`, `artifactDataStore`, `artifactTaskStore`,
  `scheduledTaskStore`, `scheduledTaskScheduler`, `emitSchedTasksEvent`,
  `triggerStore`, `triggerRunner`, `fileWatchManager`, `notificationSource`,
  `triggerSecrets`, `emitTriggersEvent`, `getHookBaseUrls`, `imageServerService`,
  `musicServerService`, `dashboardService`, `liveApi`. All optional.

Every handler is `IpcEnvelope.enveloped` (`{ success: true, ... }`, or
`{ success: false, error, ...fields }` on a throw; a result that already has
`success` passes through) except these raw ones, which renderers read bare
(several negate them): `getEnabled`, `getOpenTabOnLoad`, `getTraceCalls`,
`getDefaults`, `getServerStatus`, `chat.takeIntent`, `consumePendingSetupExpand`,
`liveApi.fetch`, `liveApi.openTab`, `liveApi.extCall`, `getUiMode`, `setUiMode`,
`getSidebarCollapsed`, `setSidebarCollapsed`, `getLastModelRef`, `setLastModelRef`.

A few replies also carry fields on failure so the renderer can render without
a check: `getModelCaps` `{ caps: null }`, `getPeerGpus` `{ peers: [], active: false }`,
`getFitResults` and `getGambitResults` `{ results: {} }`, `getLocalModelOptions`
`{ models: [] }`, `schedTasks.list` `{ tasks: [] }`, `schedTasks.runs` `{ runs: [] }`,
`chat.listModes` `{ modes: [] }`, `chat.agentTools` `{ groups: [], disabled: [] }`,
`chat.getApprovalPolicy` `{ policy: 'auto' }`, `setup.listTabs` `{ tabs: [] }`.

| Channel(s) | Routed to |
|---|---|
| `getEnabled`, `setEnabled`, `getOpenTabOnLoad`, `setOpenTabOnLoad` | the service |
| `getTraceCalls`, `setTraceCalls`, `clearTraces` | [TraceCallsSetting](ipc/TraceCallsSetting.md) |
| `getDiagnostics`, `resetNvidiaSmiPathHint` | [LlmDiagnosticsView](ipc/LlmDiagnosticsView.md) |
| `getVramPressure`, `dismissVramPressure`, `getUnloadOnVramPressure`, `setUnloadOnVramPressure`, `dismissNvidiaSmiPathHint` | the service (`{ state }`, `{ dismissed }`, `{ enabled }`) |
| `addNvidiaSmiToPath`, `recoverDisplayDevice`, `setPcieAspmOff` | [SystemDiagnostics](SystemDiagnostics.md) |
| `getModelsView`, `setModelsDir`, `getStorageInfo` | [LlmModelsView](ipc/LlmModelsView.md) |
| `getModelDisplayNames`, `setModelDisplayName` | `{ names }` from the service |
| `getPreflight` | `Preflight.collectIssues` (image server from deps or the global) |
| `checkSystemLibraries` | [SystemLibrariesCheck](ipc/SystemLibrariesCheck.md) |
| `scanExistingLibraries`, `importExistingModel` | [ExistingLlmModels](ipc/ExistingLlmModels.md) |
| `pickModelsDir`, `pickDirectory` | `PathPicker.pick` -> `{ canceled }` or `{ canceled: false, dir }` |
| `getRuntimesView`, `checkRuntimeUpdates`, `getRuntimePrerelease`, `pickRuntimeBinary`, `registerRuntimeBinary`, `locateRuntime`, `installRuntime`, `uninstallRuntime` | [LlmRuntimeSetup](ipc/LlmRuntimeSetup.md); install progress on `core.llmServer.runtimeEvent` `{ id, type, payload }` |
| `getDefaults`, `getAutoUnloadMs`, `setAutoUnloadMs`, `getRamPinStatus`, `getGroupRouterStatus` | the service (`{ ms }`, `{ status }`) |
| `setDefaults` | [LlmDefaultsUpdater](ipc/LlmDefaultsUpdater.md) |
| `getState` | [LlmAvailability](ipc/LlmAvailability.md) `safeState` |
| `getServerStatus`, `getModelCaps`, `stopServer` | the service and its supervisor |
| `getPeerGpus` | [PeerGpuView](ipc/PeerGpuView.md) |
| `startServer` | `ServerLauncher.shared.resolveAndStart(service)` |
| `getLocalModelOptions` | [LocalModelOptions](ipc/LocalModelOptions.md) |
| `runFitTest`, `cancelFitTest`, `getFitTestStatus` | [FitTestSession](ipc/FitTestSession.md); events on `core.llmServer.fitTestEvent` `{ type, payload }` |
| `getFitResults`, `getGambitResults` | `{ results }` from the service |
| `runGambit`, `cancelGambit`, `getGambitStatus`, `getGambitRaw` | [GambitSession](ipc/GambitSession.md); events on `core.llmServer.gambitEvent` |
| `chat`, `chatAbort` | [QuickChat](ipc/QuickChat.md) (`chatAbort` also aborts the router) |
| `chat2` | [ChatTurnRequest](ipc/ChatTurnRequest.md) |
| `chat.complete`, `chat.completeStream`, `chat.completeAbort` | [SideCompletions](ipc/SideCompletions.md) |
| `chat.takeoverRespond`, `chat.approvalRespond`, `listModels`, `chat.previewSystemPrompt`, `conv.autotitle`, `chat.agentTools`, `chat.setGlobalToolEnabled` | the router |
| `core.debug.getLogs` | [DebugLogsView](ipc/DebugLogsView.md) |
| `schedTasks.*` | [ScheduledTaskActions](ipc/ScheduledTaskActions.md) |
| `triggers.*` | [TriggerActions](ipc/TriggerActions.md) ([TriggerDetails](ipc/TriggerDetails.md) for `get`) |
| `conv.*` except delete, export, autotitle and artifacts | [ConversationActions](ipc/ConversationActions.md) |
| `conv.delete` | [ConversationDeletion](ipc/ConversationDeletion.md) |
| `conv.export` | [ConversationExporter](ipc/ConversationExporter.md) |
| `chat.wipeAll` | [ChatDataReset](ipc/ChatDataReset.md) |
| `chat.listModes` | `ChatModeRegistry.shared.list()` |
| `chat.getApprovalPolicy`, `chat.setApprovalPolicy` | [ApprovalPolicySetting](ipc/ApprovalPolicySetting.md) |
| `chat.readWorkspaceFile` | [WorkspaceFileViewer](ipc/WorkspaceFileViewer.md) |
| `chat.workspace.*` (7) | [WorkspaceFileIpcHandlers](chat/workspace/WorkspaceFileIpcHandlers.md) over one [WorkspaceFiles](chat/WorkspaceFiles.md) |
| `startModeIntent`, `chat.takeIntent` | [ChatModeIntent](ipc/ChatModeIntent.md) |
| `setup.listTabs`, `setup.invoke` | [SetupTabActions](ipc/SetupTabActions.md) |
| `conv.artifacts`, `artifact.*` | [ArtifactActions](ipc/ArtifactActions.md) |
| `artifactData.all`, `artifactData.mutate` | `deps.artifactDataStore` (registered only with one); changes relayed by [LlmServerBroadcast](ipc/LlmServerBroadcast.md) |
| `liveApi.fetch`, `liveApi.openTab`, `liveApi.extCall` | `deps.liveApi`, else a new [LiveApi](chat/LiveApi.md) |
| `chat.pickAttachment`, `chat.readAttachments` | [ChatAttachments](ipc/ChatAttachments.md) |
| `pageContext.listTabs` (`{ tabs: [] }` on failure), `pageContext.readTab` | [PageContextActions](ipc/PageContextActions.md) |
| `docsSource.status` (`{ available: false }` on failure or without the index) | the `docsKnowledgeBase` dep's `status()` ([DocsKnowledgeBase](../rag/DocsKnowledgeBase.md)); the same dep reaches the router as `getDocsKnowledgeBase` |
| `modelCatalog` | `{ models: CuratedModelCatalog.listCatalog() }` |
| `modelCatalogLive`, `searchModels`, `expandModelRepo`, `getModelReadme` | [HfRepoBrowser](ipc/HfRepoBrowser.md) |
| `getWizardHardware`, `recommendModel` | [ModelWizard](ipc/ModelWizard.md) |
| `planAutoSetup` | [AutoSetupPlan](ipc/AutoSetupPlan.md) |
| `openChat`, `openSetup`, `consumePendingSetupExpand` | the service |
| `cancelModelDownload`, `pauseModelDownload` | [LlmDownloadSlot](ipc/LlmDownloadSlot.md) |
| `downloadModel` | [ModelFileDownloader](ipc/ModelFileDownloader.md); events on `core.llmServer.modelEvent` `{ type, payload }` |
| `addonModelCatalog`, `setupAddonModel`, `cancelAddonSetup` | [AddonModelInstaller](ipc/AddonModelInstaller.md); events on `core.llmServer.addonEvent` `{ id, type, payload }` |
| `getUiMode`, `setUiMode`, `getSidebarCollapsed`, `setSidebarCollapsed`, `getLastModelRef`, `setLastModelRef` | the service (raw) |

Chat events (`chat`, `chat2`, `chat.completeStream`) go to the calling renderer
on `core.llmServer.chatEvent` `{ requestId, type, payload }`. Every progress
stream uses `SenderStream`, which skips a destroyed renderer.
