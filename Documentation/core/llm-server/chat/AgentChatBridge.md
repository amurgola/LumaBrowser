# AgentChatBridge

`core/llm-server/chat/AgentChatBridge.js`

Lets the chat run the agent tool loop (browser tools plus the chat's
pseudo-tools: artifacts, media, web, knowledge base, takeover...) on whatever
model the user picked, not a separate navigator slot. A facade over
[BridgeRun](bridge/BridgeRun.md) (one Tools-on turn),
[EvalTurn](bridge/eval/EvalTurn.md) (the eval and gambit entry) and
[PreviewSystemPrompt](bridge/prompt/PreviewSystemPrompt.md). It owns the
bridge-wide Stop, the set of live runs, and the two human-in-the-loop waits
([ApprovalWait](bridge/waits/ApprovalWait.md),
[TakeoverWait](bridge/waits/TakeoverWait.md)) shared by every run on it.

Callers: UnifiedChatRouter (`agentBridge`), ArtifactTaskScheduler,
ScheduledTaskScheduler, TriggerRunner, agent-manager's AgentRuntime, code
mode's sub-agent, GambitBridgeTurn and the eval adapter.

## Methods

- `new AgentChatBridge({ router })`: `router` is the UnifiedChatRouter. Used
  members: `db` (settings, also kept as `bridge.db`), `chatStore`,
  `llmServerService` (`groupRouter`, `pinnedTabId`, `runtimeServer.holdIdle`),
  `modelVisionActive(ref)`, `modelNativeToolsActive(ref)`,
  `modelNativeToolExclude(ref)`, `_completeOnce(modelRef, msgs, temperature,
  onStatus, onToken, onReasoning, onUsage, onTimings, images, nativeTools,
  extra, ctl)`, `chat(opts)` and `abort()` (eval only).
- `run(options)` returns `{ abort, done }` synchronously; `done` resolves
  after exactly one terminal hook. Resets the bridge-wide abort flag; the run's
  own handle stops only that run. Options (defaults in brackets):
  `modelRef`, `messages` (wire history, current user turn last),
  `temperature` [0.2 when unset], `conversationId`, `assistantMessageId`,
  `deps` (required: `{ db, browserService, artifactStore, mcpAggregator?,
  ragService?, artifactDataStore?, artifactTaskStore? }`), `hooks` (required), `priorMessages` [null] (persisted
  rows, for the artifact catalog), `modeSystemPrompt` [null], `turnReminder`
  [null], `images` [null], `allowedTools` [null = unrestricted],
  `refreshAllowedTools` [null] (fresh policy for mid-run admission),
  `systemPromptOverride` [null], `extraTools` [null] (mode tools, see
  [ExtraTools](bridge/tools/ExtraTools.md)), `llmExtra` [null], `noBrowser`
  [false], `ctxPerSlot` [null], `kbScope` [null = `'kb'`], `allowTakeover`
  [false], `agentBudget` [null] (see [AgentBudget](bridge/AgentBudget.md)),
  `shouldAbort` [null], `nativeHistory` [false], `nativeToolsOverride` [null,
  eval `'off'`], `promptExperiments` [null], `approvalOverride` [null],
  `pinnedTabId` [null], `approvalTimeoutMs` [null = 2 minutes].
- Hooks contract:
  - `onDelta(text)`, `onReasoningDelta(text)`, `onContentRollback(chars)`: the
    live bubble and thinking pane; a tool iteration's text is rolled back and
    diverted to the thinking pane.
  - `onToolEvent(payload)` phases: `pending` `{ tool, target, chars }` (a call
    still streaming), `run` `{ tool, params }`, `done` `{ tool, success, error,
    summary, artifact }`, `status` `{ tool, step, totalSteps | elapsedMs }`
    (media progress), `cancel` (a pending card that never became a call),
    `approval` `{ tool, params, detail }`, `approval-done` `{ tool, decision }`,
    `tab` `{ tabId }`, `tab-end` `{ tabId, frame }` (tab preview).
  - `onArtifact(artifact)` (live modules carry `html`, `js`, `libs`),
    `onArtifactStream({ phase: 'open' | 'chunk', title, type, content? })`.
  - `onToolTrace({ tools, artifacts })`: once, before the terminal hook, when
    anything ran or was produced.
  - `onStatus(payload)`: router status, media server phases `{ phase, tool }`,
    mid-turn compaction `{ phase: 'compacting' | 'compacted', midTurn: true, ... }`.
  - `onUsage(usage)`: the last completion's usage, before the terminal hook.
  - `onAgentEvent(payload)`: streamed events from delegating tools and
    `{ type: 'citations', payload: { sources } }` from the knowledge base.
  - `onDone(info)`: `{ finishReason: 'stop', usage, timings, turnTimings,
    iterations, stopReason, offFormatCalls, offFormatShapes,
    lengthCutCompletions, missingArgCalls, overflowRecoveries }`
    ([RunHealth](bridge/turn/RunHealth.md)), or `{ finishReason: 'stop',
    aborted: true }` after a Stop.
  - `onError(error)`: a thrown run, or a run error with no answer (`'aborted'`
    reads `stopped`).
- `abort()`: stops every live run (including its live completion stream) and
  cancels a pending takeover as `stop`. A pending approval is left to time out
  (legacy behaviour).
- `isAborted()`: the bridge-wide flag. `_aborted` is still a field for the
  not-yet-ported UnifiedChatRouter; new callers use `isAborted()`.
- `activeRunCount()`: live runs on this bridge.
- `respondTakeover(action)`: `'continue' | 'skip' | 'stop'` (anything else is
  continue); false when nothing is waiting.
- `respondApproval(decision)`: `'once' | 'run' | 'reject'` (anything else is
  reject); false when nothing is waiting.
- `hasPendingTakeover()`, `hasPendingApproval()`.
- `buildPreviewSystemPrompt(options)`: see
  [PreviewSystemPrompt](bridge/prompt/PreviewSystemPrompt.md).
- `runForEval(options)`: see [EvalTurn](bridge/eval/EvalTurn.md). `deps` is
  accepted and unused.

## How a turn flows

[BridgeRun](bridge/BridgeRun.md) builds the run's
[RunToolSet](bridge/tools/RunToolSet.md) (allow-list, discovered and mode
tools, required args, lazy groups) and
[NativeToolPlan](bridge/tools/NativeToolPlan.md), wraps the parser
([RunToolCallParser](bridge/parsing/RunToolCallParser.md)) and executor
([TruncationGuard](bridge/tools/TruncationGuard.md) ->
[ToolCallPipeline](bridge/tools/ToolCallPipeline.md) ->
[ToolDispatch](bridge/tools/ToolDispatch.md)) into a
[BridgeToolbox](bridge/tools/BridgeToolbox.md), and hands it with a
[CompletionDriver](bridge/turn/CompletionDriver.md) to
[AgentRunner](../agent/AgentRunner.md). Groups are pre-activated from the
message ([GroupIntent](bridge/groups/GroupIntent.md),
[GroupRouting](bridge/groups/GroupRouting.md)), the prompt append is built by
[SystemPromptAppend](bridge/prompt/SystemPromptAppend.md), loop events become
chat events through [AgentEventRelay](bridge/turn/AgentEventRelay.md), and
[TurnFinisher](bridge/turn/TurnFinisher.md) ends the turn.

## Why

AgentRunner is non-streaming per turn and only needs `sendCompletion` and
`browserTools`, so the bridge supplies both: completions go through the chat
router on the chat-picked model and stream into the bubble live, and the
executor intercepts the pseudo-tools. Output lands on the same hooks a plain
turn uses, so persistence and streaming stay identical. Each run has its own
cancel state, so a Network Sharing client's turn and the host's turn on one
bridge no longer share one Stop.
