# ChatIdleWait

`core/llm-server/chat/tasks/ChatIdleWait.js`

Waits until no chat turn is streaming. The router holds one in-flight turn, and work
that would cut across it (a turn the app starts by itself, a render that shares the
cards with the chat model) holds off until it has ended.

## Methods

- `new ChatIdleWait({ getRouter, sleep })`: `getRouter()` is the chat router (`active`
  is its turn in flight) or null before it exists, which counts as idle. `sleep` is a
  test seam.
- `until(settleMs = 0)`: resolves once no turn has been streaming for `settleMs` in a
  row, polling every `POLL_MS` (500). A turn that starts during the settle time starts
  the count again.

## Who waits

- [BackgroundTasks](BackgroundTasks.md), through `useChatIdle(() => idle.until())`:
  every laned task (a render) before it starts.
- [BackgroundTaskWake](BackgroundTaskWake.md), with a 1.5 s settle, so a message the
  user queued behind the reply is answered before the results turn.

Wired in [LlmServerIpcHandlers](../../LlmServerIpcHandlers.md)`._registerBackgroundTasks`.
