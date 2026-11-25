# ChatExtRegistry

`core/llm-server/ui/js/chat-ext/ChatExtRegistry.js`

The chat-mode registry behind `window.LumaChatExt`: backend descriptors fetched
through `api.chat.listModes` (at load, and again on `reload`), and the client hooks
each bundle registers.

## Methods

- `new ChatExtRegistry({ scriptLoader?, logger? })`.
- `registerMode(def)`, `getBackend(id)`, `getClient(id)`, `getMerged(id)`,
  `list()`, `hasModes()`, `load(api)`, `reload(api)`: behaviour as documented in
  [LumaChatExt](LumaChatExt.md).
