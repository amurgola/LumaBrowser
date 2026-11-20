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
  185 channels below on `ipcMain` (183 without `deps.artifactDataStore`) and
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
`getFitResults` `{ results: {} }`, `getLocalModelOptions`
`{ models: [] }`, `schedTasks.list` `{ tasks: [] }`, `schedTasks.runs` `{ runs: [] }`,
`chat.listModes` `{ modes: [] }`, `chat.agentTools` `{ groups: [], disabled: [] }`,
`chat.getApprovalPolicy` `{ policy: 'auto' }`, `setup.listTabs` `{ tabs: [] }`.

| Channel(s) | Routed to |
|---|---|
| `getEnabled`, `setEnabled`, `getOpenTabOnLoad`, `setOpenTabOnLoad` | the service |
| `getTraceCalls`, `setTraceCalls`, `clearTraces` | [TraceCallsSetting](ipc/TraceCallsSetting.md) |
| `getDiagnostics`, `resetNvidiaSmiPathHint` | [LlmDiagnosticsView](ipc/LlmDiagnosticsView.md) |
| `getVramPressure`, `dismissVramPressure`, `getUnloadOnVramPressure`, `setUnloadOnVramPressure`, `getVramWarning`, `setVramWarning`, `getGpuHeadroom`, `setGpuHeadroom`, `dismissNvidiaSmiPathHint` | the service (`{ state }`, `{ dismissed }`, `{ enabled }`, `{ bytes }`) |
| `addNvidiaSmiToPath`, `recoverDisplayDevice`, `setPcieAspmOff` | [SystemDiagnostics](SystemDiagnostics.md) |
| `getModelsView`, `setModelsDir`, `getStorageInfo`, `setModelDrafter` | [LlmModelsView](ipc/LlmModelsView.md) (`setModelDrafter` is `setDrafter({ key, choice })`) |
| `getModelDisplayNames`, `setModelDisplayName` | `{ names }` from the service |
| `getPreflight` | `Preflight.collectIssues` (image server from deps or the global; `llmService` from deps for the slot checks; `global.__lumaAgentManager` for the agent checks) |
| `checkSystemLibraries` | [SystemLibrariesCheck](ipc/SystemLibrariesCheck.md) |
| `getDriverInstallPlan`, `installDrivers` | [IntelDriverInstall](ipc/IntelDriverInstall.md) |
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
| `getFitResults` | `{ results }` from the service |
| `chat`, `chatAbort` | [QuickChat](ipc/QuickChat.md) (`chatAbort` also aborts the router) |
| `chat2` | [ChatTurnRequest](ipc/ChatTurnRequest.md) |
| `chat.complete`, `chat.completeStream`, `chat.completeAbort` | [SideCompletions](ipc/SideCompletions.md) |
| `chat.takeoverRespond`, `chat.approvalRespond`, `listModels`, `chat.previewSystemPrompt`, `conv.autotitle`, `chat.agentTools`, `chat.setGlobalToolEnabled` | the router (`listModels` first awaits the service's `freshInstalledChatModels()`; a failed scan lists the last known) |
| `modelSettings.get(ref)`, `modelSettings.setModel(ref, payload)`, `modelSettings.saveProfile(input)`, `modelSettings.deleteProfile(id)` | the service's [ModelSettings](service/ModelSettings.md): `{ view }`, `{ view }`, `{ profile }`, `{ deleted }` (the Tune panel) |
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
| `downloadDrafter` | [DrafterInstaller](ipc/DrafterInstaller.md); events on `core.llmServer.modelEvent` with `kind: 'drafter'` |
| `addonModelCatalog`, `setupAddonModel`, `cancelAddonSetup` | [AddonModelInstaller](ipc/AddonModelInstaller.md); events on `core.llmServer.addonEvent` `{ id, type, payload }` |
| `getUiMode`, `setUiMode`, `getSidebarCollapsed`, `setSidebarCollapsed`, `getLastModelRef`, `setLastModelRef` | the service (raw) |

Chat events (`chat`, `chat2`, `chat.completeStream`) go to the calling renderer
on `core.llmServer.chatEvent` `{ requestId, type, payload }`. Every progress
stream uses `SenderStream`, which skips a destroyed renderer.

## Changes (2026-11-09, helper model)

`getHelperModelStatus` -> `{ status: svc.helperModel.getStatus() }` (185 channels). `convJobs.list` and `convJobs.cancel` (the background jobs a conversation is waiting on, see [ConversationJobs](chat/jobs/ConversationJobs.md)) bring it to 187. The Model Testing move (2026-11-18) took the five `*Gambit*` channels out (182), and the low-VRAM warning switch's `getVramWarning` and `setVramWarning` (`{ enabled }`) bring it to 184.

## Changes (2026-11-19, background tasks)

`convJobs.followTurn(requestId)` brings it to 185: a chat page asks for the stream of a
turn the app announced (a `turn` event on the conversation-jobs channel) and gets
[HostTurnFollowers](ipc/HostTurnFollowers.md)`.follow` with a `SenderStream` on the chat
event channel under that request id (`{ success: false }` when the turn has already
started). `_registerBackgroundTasks(router, tasks?)`, called at the end of
`_registerConversationJobs`, wires the rest: a [ChatIdleWait](chat/tasks/ChatIdleWait.md)
over the router, given to [BackgroundTasks](chat/tasks/BackgroundTasks.md)`.shared` as
`useChatIdle` (a render waits for the reply in flight to end), and a
[BackgroundTaskWake](chat/tasks/BackgroundTaskWake.md) watching it, which starts a
[BackgroundTaskTurn](chat/tasks/BackgroundTaskTurn.md) announced through
`LlmServerBroadcast.hostTurnStarting`.
