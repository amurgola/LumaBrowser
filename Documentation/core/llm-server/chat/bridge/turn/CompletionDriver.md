# CompletionDriver

`core/llm-server/chat/bridge/turn/CompletionDriver.js`

The `sendCompletion` the bridge hands AgentRunner.

## Methods

- `new CompletionDriver(o)`: `{ router, modelRef, temperature, hooks,
  llmExtra, conversationId, assistantMessageId, turnReminder, parallel,
  control, mirror, reasoning, images, health, replyCap, parser, nativePlan,
  toolSet }`.
- `sendCompletion(slotId, msgs, opts)` (bound): AgentRunner's run-summary
  request (system prompt starting with `AgentLoopText.SUMMARY_INSTRUCTION`)
  returns an empty completion without a model call. Otherwise starts the
  iteration on the mirror and reasoning relay, appends the
  [TurnReminder](TurnReminder.md), and calls `router._completeOnce(modelRef,
  msgs, temperature (opts, else the run's, else 0.2), onStatus, onToken,
  onReasoning, onUsage, onTimings, images, nativeTools, extra, ctl)` with
  `extra` = `llmExtra` plus `trace { conversationId, turnId, callType
  ('compact' for a compaction) }`, `pinTemperature: true` and `maxTokens`
  ([ReplyCap](ReplyCap.md)). A length cut raises the reply cap.
