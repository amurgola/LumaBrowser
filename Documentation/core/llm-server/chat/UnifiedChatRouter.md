# UnifiedChatRouter

`core/llm-server/chat/UnifiedChatRouter.js`

The one entry point for chat. Hides whether a turn runs on the managed local
server (`local::<modelBasename>`) or a remote provider config
(`<providerConfigId>::<modelId>`, a sharing peer included), normalises every
stream onto the chat event shape, and owns the single in-flight turn. A facade
over the classes in [router/](router/); callers are the llm-server IPC handlers,
the [agent bridge](AgentChatBridge.md), the schedulers and triggers, the sharing
host, the placement test, Luma On Demand and the extension chat surface.

## Construction

`new UnifiedChatRouter({ llmServerService, db, getAgentDeps, ...seams })`

- `llmServerService`: owns `chatStore`, the defaults, `runtimeServer`, the local
  provider entry and the last model ref. `db`: the settings database.
- `getAgentDeps`: lazy `() => { browserService, artifactStore,
  artifactDataStore, mcpAggregator, ... } | null` (the browser and extensions
  do not exist yet at boot).
- `getDocsKnowledgeBase`: lazy `() => DocsKnowledgeBase | null`, the shipped
  documentation index behind the "@lumabrowser-documentation" source, handed to
  [ChatTurn](router/ChatTurn.md) as `getDocs` (default: none).
- Test seams, each with its production default: `agentBridge` (new
  AgentChatBridge over this router), `modeRegistry` (`ChatModeRegistry.shared`),
  `compaction` (new Compaction), `launcher` (`ServerLauncher.shared`), `scanner`
  (`LlmModelsScanner.shared`), `runtimeCatalog` (`LlmRuntimeCatalog.shared`),
  `adapterRegistry` (ChatAdapterRegistry), `dispatcher` (a ModelDispatcher over
  LocalStream and RemoteStream; anything with `dispatch(...)`),
  `imageServerService` (a getter, default `global.__lumaImageServerService`).
- Sets `global.__lumaChatRouter = this`.
- Public fields: `llmServerService`, `db`, `agentBridge`. Getters: `chatStore`
  (the service's), `active` (the in-flight turn's abort handle or null).

## Methods

Models and capabilities:
- `listModels()` -> [ChatModelList](router/ChatModelList.md)`#list`.
- `contextWindowFor(ref)` -> [ModelContextWindow](router/ModelContextWindow.md)`#forRef`.
- `modelVisionActive(ref)`, `modelNativeToolsActive(ref)`,
  `modelNativeToolExclude(ref)` -> [ModelCapabilities](router/ModelCapabilities.md).

Agent tools:
- `previewSystemPrompt(opts)` -> [SystemPromptPreview](router/SystemPromptPreview.md).
- `getAgentToolCatalog()`, `resolveAllowedTools(convId, deps)`,
  `setGlobalToolEnabled(name, enabled)` -> [AgentToolPolicy](router/AgentToolPolicy.md).
- `getAgentDeps()`.

Chat:
- `chat(args)` -> a fresh [ChatTurn](router/ChatTurn.md)`#run(args)`. Events
  through `args.send(type, payload)`: `meta`, `delta`, `reasoning-delta`,
  `status`, `tool`, `artifact`, `artifact-stream`, `agent` (or a mode's own
  type), `rollback`, `done`, `error` (see [TurnStream](router/TurnStream.md)).
- `abort()`: stops every agent run on the bridge and the in-flight turn
  (`done { aborted: true }`); a local turn's slot is reclaimed
  ([LocalSlotReclaimer](router/LocalSlotReclaimer.md)). Returns `{ success: true }`.
- `generateTitle(convId)` -> [TitleGenerator](router/TitleGenerator.md).
- `complete(opts)`, `completeStream(opts, ext)` -> [SideCompletion](router/SideCompletion.md).
- `_completeOnce(modelRef, messages, temperature, onStatus, onToken,
  onReasoningToken, onUsage, onTimings, images, tools, extra, ctl)`: the agent
  bridge's per-iteration completion, positional as the bridge calls it ->
  [AgentCompletion](router/AgentCompletion.md)`#completeOnce`.

Network Sharing:
- `proxyStream(opts)`, `proxyAgent(opts)` -> [ProxyTurns](router/ProxyTurns.md).

Human in the loop:
- `respondTakeover(action)`, `respondApproval(decision)`: forwarded to the
  bridge; false when nothing waits or the bridge throws.

Artifacts ([ArtifactAccess](router/ArtifactAccess.md)):
- `getArtifact(id)`, `getArtifactHtml(id, opts)`, `getArtifactData(id)`,
  `mutateArtifactData(id, ops)`, `listConversationArtifacts(convId)`.

## How a turn flows

[ChatTurn](router/ChatTurn.md) supersedes the in-flight turn
([InFlightTurn](router/InFlightTurn.md)), opens the conversation
([TurnConversation](router/TurnConversation.md)), persists image attachments
([AttachmentArtifacts](router/AttachmentArtifacts.md)), applies the chat mode
([ChatModeTurn](router/ChatModeTurn.md)), streams into a
[TurnStream](router/TurnStream.md), compacts
([CompactionGate](router/CompactionGate.md)), adds the style documents
([ChatStyleDocs](router/ChatStyleDocs.md)), resolves the
[ThinkingDial](router/ThinkingDial.md) and dispatches: Tools-on through
[AgentTurnDispatch](router/AgentTurnDispatch.md) to the bridge, whose
iterations come back through `_completeOnce`; plain turns through the
[ModelDispatcher](router/ModelDispatcher.md), which records the LLM trace and
routes to [LocalStream](router/LocalStream.md)
([LocalServerPrep](router/LocalServerPrep.md),
[LocalRestartDecision](router/LocalRestartDecision.md),
[LocalRequest](router/LocalRequest.md)) or
[RemoteStream](router/RemoteStream.md). A mode's post-turn reaction runs
through [ModeReaction](router/ModeReaction.md).

## Why

LLMService's slot path runs through the queue and its provider singletons
persist endpoint and key on every setter, so driving chat through it would
clobber the user's global provider config. Remote turns get an ephemeral
provider over a non-persisting settings view instead. One in-flight turn is the
legacy contract: a new turn supersedes the old, and schedulers, triggers and
the terminal bridge defer while `active` is set.
