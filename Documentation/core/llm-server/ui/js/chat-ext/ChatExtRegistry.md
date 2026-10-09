# ChatExtRegistry

`core/llm-server/ui/js/chat-ext/ChatExtRegistry.js`

The chat-mode registry behind `window.LumaChatExt`: backend descriptors fetched
once through `api.chat.listModes`, and the client hooks each bundle registers.

## Methods

- `new ChatExtRegistry({ scriptLoader?, logger? })`.
- `registerMode(def)`, `getBackend(id)`, `getClient(id)`, `getMerged(id)`,
  `list()`, `hasModes()`, `load(api)`: behaviour as documented in
  [LumaChatExt](LumaChatExt.md).
