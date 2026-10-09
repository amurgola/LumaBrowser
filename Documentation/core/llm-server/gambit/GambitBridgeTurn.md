# GambitBridgeTurn

`core/llm-server/gambit/GambitBridgeTurn.js`

The live `runTurn` for [GambitRunner](GambitRunner.md): drives one turn
through the real AgentChatBridge with the same agent deps a user's chat turn uses.

## Methods

- `GambitBridgeTurn.create({ bridge, deps, modelRef = null, nativeHistory = false, nativeTools = null, agentEffort = null, parallel = null, promptExperiments = null })`
  returns `runTurn({ task, prompt, priorMessages, timeoutMs })`, which calls
  `bridge.runForEval({ task, prompt, priorMessages, conversationId, timeoutMs,
  deps, modelRef, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments })`.
  Throws `makeGambitRunTurn: an AgentChatBridge with runForEval is required`
  when the bridge has no `runForEval`.
- `GambitBridgeTurn.conversationIdFor(task)` is `gambit-<task.id>`.

## Why

One conversation id per task, so the bridge's per-conversation state (above
all, the active tool groups) behaves the way it would for a user working
through the same turns.
