# BackgroundTaskTurn

`core/llm-server/chat/tasks/BackgroundTaskTurn.js`

The chat turn that hands a reply's finished background tasks back to the model: an
automated message carrying their results is written into the conversation in the
user's place, and the model answers it on the conversation's own model and settings,
streamed to whichever chat pages follow it. Started by
[BackgroundTaskWake](BackgroundTaskWake.md).

## Methods

- `new BackgroundTaskTurn({ getRouter, followers })`: `getRouter()` is the chat router
  or null; `followers` is [HostTurnFollowers](../../ipc/HostTurnFollowers.md).
- `start(conversationId, tasks, stillRunning)`: resolves the router's `chat` result,
  null when the conversation is gone, or `BUSY`. In order:
  1. the message text, [BackgroundTaskText](BackgroundTaskText.md)`.notice(tasks,
     stillRunning)`, and the row data below;
  2. `followers.open({ conversationId, notice })` announces the turn to the pages and
     resolves its `send` after a short wait;
  3. if a reply began meanwhile (`router.active`), `BUSY`: starting now would cut that
     reply off, nothing was written, and the wake tries again once the chat is idle;
  4. `router.chat` with the conversation's `modelRef` (or the router's default), the
     stored history ([StoredHistory](../router/StoredHistory.md)) plus the notice as the
     last user message, `agent: true`, the conversation's `reasoningEffort`, the
     followers' `send`, and `userNotice: { provider: 'background-task', toolCalls }`
     ([ChatTurn](../router/ChatTurn.md)).
- `rowData(tasks)`: what the stored user row keeps beside its text:
  `{ startedBy, backgroundTasks, artifacts }`. `startedBy` is the assistant message that
  started the tasks when they all came from one reply (else null); `backgroundTasks` is
  each task's `{ id, title, tool, state, durationMs, stoppedBy }`; `artifacts` is
  everything the tasks made, kept where an attached image is kept.

## Why a user-role row

The model answers a user turn, and the history of the conversation must show what it
was answering. The row's provider (`background-task`) tells the page it was written by
the app and not typed by the user, and
[TaskNoticeView](../../ui/js/chat/turns/TaskNoticeView.md) draws it as a slim line
instead of a user bubble. `startedBy` lets the page join that line and the report to the
reply that started the tasks while nothing was said in between.
