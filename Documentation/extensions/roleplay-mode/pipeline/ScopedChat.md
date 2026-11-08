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
