# ChatModeRegistry

`core/llm-server/chat/ChatModeRegistry.js`

The registry of extension chat modes (roleplay, game, scheduled task, ...) that
the chat router consults per turn and the chat UI lists as conversation modes.
Extends [ContributionRegistry](../../shared/registry/ContributionRegistry.md).

## Methods

- `ChatModeRegistry.shared` is the process-wide instance.
- `register(descriptor, extensionId)`, `unregister(id)`,
  `unregisterByExtension(extensionId)`, `get(id)`, `has(id)` as in the base.
  `register` throws for the reserved id `chat`. `get` returns the full descriptor,
  functions included.
- `list()` returns IPC-safe descriptors: `{ id, label, description, icon,
  requirements, setupSchema, hasBuildTurn, agent, launcher, hidden, chatUiUrl }`.
  Functions and the owner id are stripped. `label` defaults to the id;
  `launcher` is `'sidebar'` only when set so, otherwise `'landing'`; `agent` and
  `hidden` are true only for a literal `true`.
- `notifyConversationDeleted(meta)` fires the mode's `onConversationDeleted({
  conversationId, meta })` for `meta.mode`, fire-and-forget. A throwing or
  rejecting hook is swallowed.

## Descriptor shape

```
{
  id: 'roleplay',              // unique; matches llm_conversations.mode
  label, description, icon,
  requirements: ['llm','image'],
  agent: true,                 // every turn is agentic, so the UI starts with Tools on
  launcher: 'landing'|'sidebar',
  hidden: true,                // never in the picker; conversations made by the owning feature
  setupSchema: {...},          // drives the setup modal
  chatUiUrl,                   // stamped by ExtensionManager from the manifest
  buildTurn({ meta, messages, conversationId, modelRef }),  // -> { systemPrompt?, tools?, temperature?, reactions? }
  tools: { name: async (params, ctx) => ... },              // ctx = { conversationId, meta, send, emit }
  onConversationDeleted({ conversationId, meta }),
}
```

## Why

A shared instance rather than constructor injection: the router is built at
boot inside `core/llm-server`, while extensions activate later through
`core/shell/ExtensionManager`. Threading one instance through both would mean
reworking unrelated wiring, so both sides reach `ChatModeRegistry.shared`.
ExtensionManager also calls `unregisterByExtension` on deactivate.

`buildTurn` receives the `modelRef` this turn resolved to; a mode that spawns its
own agent runs must pass it on, or they use the global default instead.

`notifyConversationDeleted` must be called before the conversation's rows are
removed so the hook can still read meta, and it must never fail or delay the
delete, which is why the hook is not awaited and its errors are dropped.

Sidebar launchers are reserved for always-there utilities (Chat with agent,
Scheduled Task) so the sidebar does not fill up as mode extensions are installed.
