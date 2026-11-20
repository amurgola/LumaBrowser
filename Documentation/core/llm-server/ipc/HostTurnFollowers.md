# HostTurnFollowers

`core/llm-server/ipc/HostTurnFollowers.js`

Gets a chat turn the app starts by itself (a background task's results,
[BackgroundTaskTurn](../chat/tasks/BackgroundTaskTurn.md)) onto the chat pages. The turn
is announced by id only, each page that wants its stream asks for it and is told what
the turn is about, and after a short wait the turn starts streaming to the pages that
asked.

## Methods

- `new HostTurnFollowers({ announce, sleep, newRequestId })`: `announce({ conversationId,
  requestId })` tells every page a turn is about to start
  ([LlmServerBroadcast](LlmServerBroadcast.md)`.hostTurnStarting`, a `turn` event on the
  conversation-jobs channel). `sleep` and `newRequestId` (`host-<ms>-<rand>`) are seams.
- `open({ conversationId, notice })` -> the turn's `send(type, payload)`. It mints the
  request id, announces it, waits `WAIT_MS` (400) for pages to ask, closes the turn to
  late askers, and returns a `send` that passes every event to each page that asked in
  time. `notice` (`{ content, toolCalls }`) is what a following page shows before the
  reply.
- `follow(requestId, send)` -> `{ success: true, conversationId, notice }`, or
  `NOT_OPEN` (`{ success: false }`) for an unknown id or one whose turn has started. The
  IPC channel `convJobs.followTurn` calls it with a sender on the chat event channel
  ([LlmServerIpcHandlers](../LlmServerIpcHandlers.md)).

## Why ids only

The broadcast reaches every renderer, including pages that are not the chat. Only the
pages that ask get the conversation's text, through their own sender. A page that asks
too late shows the turn the next time the conversation opens, from the stored rows.

The page side is [HostTurns](../ui/js/chat/stream/HostTurns.md).
