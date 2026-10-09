# PublishedToolEnabler

`extensions/tool-forge/PublishedToolEnabler.js`

The publish-time enable: a tool the user just had built is a tool the user
wants to use.

## Methods

- `new PublishedToolEnabler({ rawDb, getChatStore })`.
- `enable(name, conversationId)` returns `{ global, conversation, groupActivated }`:
  1. Global: removes `name` from `core.chat.disabledAgentTools` and appends it
     to `core.chat.defaultOffToolsSeeded` (so no default-off pass re-disables
     it). `global` is false only if the db throws.
  2. Without a conversation id or chat store (Setup-tab or external MCP
     publish) it stops here. An unknown conversation (ephemeral web proxy id)
     stops too.
  3. Removes `name` from the conversation's `disabledTools`
     (`conversation: true`), then adds it to the meta
     `data.activeToolGroups` (extension lazy groups are keyed by tool name;
     `groupActivated: true`). Per-chat failures are swallowed.
