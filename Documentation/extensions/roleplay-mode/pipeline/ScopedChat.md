# ScopedChat

`extensions/roleplay-mode/pipeline/ScopedChat.js`

`context.chat` as the reaction pipeline sees it (a Proxy, so every other
member reads through live).

## Methods

- `ScopedChat.wrap(chat)`: inside a [ReactionScope](ReactionScope.md),
  `complete(opts)` adds `signal` (see
  [SideCompletion](../../../core/llm-server/chat/router/SideCompletion.md)) and
  throws the scope's stop before the call and after it returns;
  `generateImage(opts)` throws it before starting. Outside a scope both pass
  straight through; a chat without the method keeps it undefined.

## Trace tag (2026-11-09)

Inside a reaction every side completion also carries
`trace: { conversationId, turnId: messageId, callType: 'side' }` unless the
caller set one, so the LLM trace and the Roleplay Lab can tell which turn a
stage or casting call served.

## Turn journal (2026-11-12)

Every side completion made inside a reaction is also handed to
`TurnJournal.shared.side` with its request, its answer and the time it took.
A story without the verbose turn log option records nothing.
