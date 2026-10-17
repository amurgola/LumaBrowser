# ConversationGrants

`core/llm-server/chat/approval/ConversationGrants.js`

"Allow desktop control" carried across the turns of one conversation. A grant
family marked `carry` in `ApprovalGate.GRANT_FAMILIES` is kept in the
conversation's meta (`data.familyGrants`, `{ key: lastUsedAt }`) and lapses
after `IDLE_MS` without use.

## Methods

- `new ConversationGrants(store, conversationId, now = Date.now)`: `store` a
  ChatStore (`getMeta`, `setMeta`).
- `live()` the carried family keys used within `IDLE_MS`.
- `touch(key)` records a grant or a use of it. Keys that are not carried (a
  single tool's run grant) are ignored; a key written less than
  `TOUCH_EVERY_MS` ago is not rewritten; a store failure is swallowed (the grant
  still holds for the run).
- `runApprovals()` `{ granted: live(), onGranted: touch, onUsed: touch }`, the
  seed [AgentTurnDispatch](../router/AgentTurnDispatch.md) hands a chat run.
- Statics: `IDLE_MS` (30 min), `META_KEY` (`familyGrants`), `TOUCH_EVERY_MS` (60 s).

## Why

A desktop task spans several turns, and asking again every turn pulls the focus
back to LumaBrowser each time. The idle lapse means reopening an old chat asks
again; per-tool grants still die with their run. Every use refreshes the grant,
but one write a minute is enough to keep a 30-minute window honest.
