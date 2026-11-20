# HostTurns

`core/llm-server/ui/js/chat/stream/HostTurns.js`

Follows the chat turns the host starts by itself (a background task's results handed
back to the model, [BackgroundTaskTurn](../../../../chat/tasks/BackgroundTaskTurn.md)):
asks for an announced turn's stream, and when its first event arrives makes it the turn
in flight. Component `hostTurns` of [ChatMode](../ChatMode.md).

## Methods

- `follow({ conversationId, requestId })`: the `turn` job event, routed by
  [ChatSubscriptions](../ChatSubscriptions.md). Calls `api.convJobs.followTurn(requestId)`
  ([HostTurnFollowers](../../../../ipc/HostTurnFollowers.md) on the host) and, when the
  host accepts, keeps the turn with its opening message until its first event. At most
  `KEEP` (8) announced turns are kept; a turn the host never starts is dropped with age.
  A host without `convJobs.followTurn` follows nothing.
- `begin(requestId)`: asked by [ChatEventRouter](ChatEventRouter.md) about a chat event
  that is not the turn in flight's. True when it is the first event of a followed turn,
  which is then the turn in flight:
  - its conversation on screen (active, with a thread): [TurnSender](TurnSender.md)
    `.showHostTurn(opening, requestId)` draws the notice and the reply's placeholder;
  - another conversation on screen: `trackHostTurn(conversationId, requestId)` tracks
    the stream quietly, and opening the conversation shows it.
  False, and the turn let go, while another reply is streaming on this surface: the
  conversation shows it the next time it is opened.
- `HostTurns.openingMessage(notice)`: `{ role: 'user', content, provider:
  'background-task', toolCalls }`, the message as the thread holds it, which
  [TaskNoticeView](../turns/TaskNoticeView.md) draws.

## Why the first event

The host waits a moment after the announcement before the turn streams, and a page may
be busy when it asks. Becoming the turn in flight on the first event, not on the
answer to `followTurn`, means the page never shows a turn that did not start, and the
request id is the host's own (`ChatState.newRequestId(given)`), so every later event of
the turn matches.
