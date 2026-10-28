# BridgeRun

`core/llm-server/chat/bridge/BridgeRun.js`

One Tools-on chat turn: wires the run's tool set, parser, dispatch pipeline and
streaming into an AgentRunner driven by the user's model, runs it, and
normalises its output onto the chat router's hooks.

## Methods

- `new BridgeRun(host, options)`: `host` is `{ router, db, isBridgeAborted(),
  approvalWait, takeoverWait }` (from the facade); `options` are
  [AgentChatBridge](../AgentChatBridge.md)`.run`'s, undefined values falling
  back to `BridgeRun.DEFAULTS`. Creates `control` ([RunControl](turn/RunControl.md)).
- `start()` returns `{ abort, done }`. Setup is synchronous (and throws for a
  missing `deps`); `done` runs the turn and resolves after the terminal hook.
- `BridgeRun.DEFAULTS`, `IMAGES_GROUP`.

## Flow

1. Tools: [RunToolSet](tools/RunToolSet.md), [NativeToolPlan](tools/NativeToolPlan.md),
   [AgentBudget](AgentBudget.md), [RunHealth](turn/RunHealth.md),
   [RunToolCallParser](parsing/RunToolCallParser.md), and the executor chain
   [TruncationGuard](tools/TruncationGuard.md) -> [ToolCallPipeline](tools/ToolCallPipeline.md)
   ([ToolLoopMonitor](../ToolLoopMonitor.md), watched by RunHealth for the done payload;
   [ApprovalCheck](tools/ApprovalCheck.md))
   -> [ToolDispatch](tools/ToolDispatch.md), in a [BridgeToolbox](tools/BridgeToolbox.md).
   The approval policy is `ApprovalPolicy.resolveRun` over the
   `core.llmServer.chat.approvalPolicy` setting, interactive when
   `allowTakeover`; `approvedTools`, `onRunApproval` and `onRunApprovalUsed`
   become its `granted`, `onGranted` and `onUsed`.
2. Streaming: [StreamMirror](turn/StreamMirror.md), [RunImages](turn/RunImages.md),
   [CompletionDriver](turn/CompletionDriver.md), [AgentEventRelay](turn/AgentEventRelay.md).
3. Agent: `new AgentRunner({ browserTools, sendCompletion }, { browserService },
   deps.db)`.
4. Turn: [TurnPrompt](prompt/TurnPrompt.md), groups pre-activated by
   [GroupIntent](groups/GroupIntent.md), the [ArtifactCatalog](prompt/ArtifactCatalog.md),
   the [VisionHint](prompt/VisionHint.md).
5. `done`: [GroupRouting](groups/GroupRouting.md), the
   [ImagePromptHint](prompt/ImagePromptHint.md) when the images group is
   active, [SystemPromptAppend](prompt/SystemPromptAppend.md) (with the run's
   own available groups), `RunToolSet#runToolList`, then `agent.run` with the
   catalog plus task, `priorTurns`, the [RunResultSpill](RunResultSpill.md)
   writer, `tabId`/`lazyTab` (a pinned tab is used as is), `autoCloseTab:
   false`, the budget, `tools`, `systemPromptAppend`, `systemPromptOverride`,
   `promptExperiments`, `nativeTools`, `nativeToolsTokens`,
   `onToolResultEvicted` (mode tools' eviction hooks), `noBrowser`,
   `ctxPerSlot`, `screenshotVision`, `onEvent`, `onWorkTab` (the
   [TabPreviewSession](TabPreviewSession.md), none for a pinned tab) and
   `shouldAbort`.
6. The preview ends BEFORE any terminal hook, then [TurnFinisher](turn/TurnFinisher.md);
   a lazily created work tab is closed after, off the critical path.

## Tool context

Every built-in handler's `ctx` carries `conversationId`, `assistantMessageId`,
`deps`, `hooks`, `artifacts`, `trace`, `isAborted`, `ctxPerSlot`,
`editRegions` (an [EditRegionIndex](prompt/EditRegionIndex.md) of the regions
the user painted in earlier turns, for `edit_image`), `kbScope`, `webSession`,
`webTabRender`, `allowTakeover`, `takeoverWait` and `takeoverAttention`.

## Outside the chat

- The approval check gets a [DesktopCallRisk](../approval/DesktopCallRisk.md)
  assessor over [BridgeGlobals](BridgeGlobals.md)`.desktopService()`, so a
  password field or a payment window asks every time.
- The tool context carries `takeoverAttention` (the host's, see
  [AgentChatBridge](../AgentChatBridge.md)) for `ask_user_takeover`.
- The event relay gets the host's [RunProgress](turn/RunProgress.md); the run
  reports its end to it before any terminal hook (`_endProgress`).
