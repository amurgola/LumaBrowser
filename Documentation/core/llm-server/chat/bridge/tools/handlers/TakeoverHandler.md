# TakeoverHandler

`core/llm-server/chat/bridge/tools/handlers/TakeoverHandler.js`

`ask_user_takeover`: the loop blocks until the chat card answers. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, _params, ctx)`: `NO_USER` refusal unless `ctx.allowTakeover`;
  else `ctx.takeoverWait.wait()` ([TakeoverWait](../../waits/TakeoverWait.md)).

## Attention

`execute` raises `ctx.takeoverAttention` (an
[ApprovalAttention](../../../approval/ApprovalAttention.md) the bridge owns)
with the model's `reason` and `{ kind: 'takeover', tool }` while the wait is
pending, and clears it after, however the wait ends: the window flashes, a
notification says "LumaBrowser needs you", and the desktop island shows Done,
Skip and Stop ([TakeoverPresenter](../../../../../../extensions/desktop-integration/features/agent-run/TakeoverPresenter.md)).
