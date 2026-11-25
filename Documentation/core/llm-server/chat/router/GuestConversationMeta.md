# GuestConversationMeta

`core/llm-server/chat/router/GuestConversationMeta.js`

The meta of one conversation the host does not keep (a Network Sharing client
owns its chats): the `getMeta` / `setMeta` surface
[ConversationPlan](../plan/ConversationPlan.md) and
[ConversationMediaModels](ConversationMediaModels.md) read, held in memory for
one turn.

## Methods

- `new GuestConversationMeta(data)`: seeded with what the client sent
  (`{ plan, mediaModels }`); values that are not objects are dropped.
- `getMeta()`: `{ data }` (a copy).
- `setMeta(conversationId, patch)`: replaces `data` with `patch.data`.

## Why

[GuestTurnDispatch](GuestTurnDispatch.md) hands it to `PlanTool.forTurn` and to
the bridge as `conversationMeta`, so `update_plan` and the media tools work on a
guest turn exactly as on the host's own chat.
