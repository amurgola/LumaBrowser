# TakeoverHandler

`core/llm-server/chat/bridge/tools/handlers/TakeoverHandler.js`

`ask_user_takeover`: the loop blocks until the chat card answers. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, _params, ctx)`: `NO_USER` refusal unless `ctx.allowTakeover`;
  else `ctx.takeoverWait.wait()` ([TakeoverWait](../../waits/TakeoverWait.md)).
