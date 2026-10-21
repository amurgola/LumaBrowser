# TurnStream

`core/llm-server/chat/router/TurnStream.js`

The live side of one chat turn: accumulates the stream into the assistant placeholder and finalises it exactly once.

## Methods

- `new TurnStream({ chatStore, send, conversationId, assistantMessageId, contextWindow, onSettled, react, coalescer? })`.
- `hooks`: `onDelta` (`delta`), `onReasoningDelta` (`reasoning-delta`), both gathered per frame by a
  [DeltaCoalescer](DeltaCoalescer.md) and flushed ahead of any other event (so a `tool`, `rollback`, `status` or the
  terminal never reaches the renderer before the text it followed), `onUsage`, `onStatus` (`status`), `onDone`, `onError` (`error` with `LaunchErrorHints`), `onToolEvent` (`tool`), `onArtifact` (`artifact`), `onArtifactStream` (`artifact-stream`), `onAgentEvent` (a typed payload under its own type, else `agent`), `onContentRollback` (`rollback { chars }`, trimming the persisted text), `onToolTrace` (persisted as `toolCalls { tools, artifacts }`). Nothing streams after the terminal.
- The first terminal updates the row (`content`, `reasoning`, `tokensIn`, `tokensOut` plus the patch), calls `onSettled()`, and sends one `done` (`finishReason`, `usage`, `timings`, `contextWindow`, ids, `iterations`, `turnTimings`, `stopReason`, `offFormatCalls`, `offFormatShapes`, `lengthCutCompletions`, `missingArgCalls`, `overflowRecoveries`, `toolLoop` (the [ToolLoopMonitor](../ToolLoopMonitor.md) report)) or `error`. `react(content, false)` runs only for the first `onDone`.
- `fail(err)`: finalises as an error, returns `{ message, hints }`.
- `abort(handle)`: finalises `done { aborted: true, conversationId, assistantMessageId }` FIRST, then aborts the handle, then `react(content, true)` unless already finished.
- `finished`.

## Why

One IPC message per token was a structured clone and a renderer wake-up for every token; at the 100 tokens/s a
small model reaches on a fast card, and with a sharing host serving several clients, that is the main process's
busiest loop. Sixteen milliseconds is one display frame: nothing the eye can see, and several tokens folded into one
message. Tearing down first let an adapter's own onDone win the latch and present a cut-off answer as finished (seen live 2026-08-10). Some adapters fire onDone twice; a second reaction aborted the first one's image generation.
