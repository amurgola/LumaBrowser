# TaskNoticeView

`core/llm-server/ui/js/chat/turns/TaskNoticeView.js`

The thread's line for a message the app wrote to the model in the user's place when
background tasks ended ([BackgroundTaskTurn](../../../../chat/tasks/BackgroundTaskTurn.md)):
one slim row ("Background task finished", then "Back up the photos · 58 min") that unfolds to
each task's outcome and the exact text the model was given, with whatever the tasks made
shown under it. Component `taskNotices` of [ChatMode](../ChatMode.md), called by
[TurnRenderer](TurnRenderer.md).

## Methods

- `TaskNoticeView.isNotice(m)`: a user message with provider `background-task`.
- `render(m)`: a `.cm-turn.task-notice` element (with `data-msg-id`) holding a
  `<details class="cm-task-notice">`: the summary (headline, detail, chevron), then one
  row per task with its title, state and time, the label "What the model was told" and
  the message text in a `<pre>`. The row's artifacts follow as
  [ArtifactChips](ArtifactChips.md).
- `tasks(m)`: `m.toolCalls.backgroundTasks` narrowed to entries with a title; a row from
  another build may hold none.
- `headline(tasks)`: `Background task finished` (or `failed`, `stopped`) for one task,
  `3 background tasks ended` for several. A failed task colours it (`is-failed`).
- `detail(tasks)`: one task's title and time; for several, how they ended (`2 finished,
  1 failed`).
- `duration(ms)`: `8 s`, `12 min`, `1 h 05 min`; `''` when unknown.

## Joined to the reply

The element gets `is-continuation` when the message right before it is the assistant
message named in `m.toolCalls.startedBy`. Nothing was said in between, so the reply that
started the tasks, this line and the reply that reports on them are drawn as one
answer. Once the user has gone on with the conversation, the results stand as a turn of
their own at the end. The styles are the `.cm-task-notice-*` rules in `chat.css`.
