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
  iteration on the mirror and reasoning relay, writes the
  [TurnReminder](TurnReminder.md) into the history (`appendKeeping`, with the
  clock from `o.now()`, else `new Date()`), reports the run's first task text
  to `o.onFirstSend(text)` once (text content only), and calls `router._completeOnce(modelRef,
  msgs, temperature (opts, else the run's, else 0.2), onStatus, onToken,
  onReasoning, onUsage, onTimings, images, nativeTools, extra, ctl,
  nativeCallStream.onDelta)` with
  `extra` = `llmExtra` plus `trace { conversationId, turnId, callType
  ('compact' for a compaction) }`, `pinTemperature: true`, `complexity`
  ([RequestComplexity](../../RequestComplexity.md)`.ofAllows(toolSet.allows)`,
  `'light'` for a compaction), `maxTokens`
  ([ReplyCap](ReplyCap.md)) and `parallelToolCalls` (the run's `parallel`, so
  llama.cpp is asked for several calls only when the pool can run them). A length cut raises the reply cap. A fresh
  [NativeCallStream](NativeCallStream.md) per iteration puts up the pending
  card for a native model's calls as their fragments arrive.
