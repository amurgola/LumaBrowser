# FileActionEnv

`extensions/desktop-integration/features/file-actions/FileActionEnv.js`

What the install can do right now, for [FileActionCatalog](FileActionCatalog.md).
Every probe is live and never throws.

- `canChat()`: `ExtensionGlobals.llmServerService()` has `openChat` and
  `setChatIntent` (what ChatHandoff needs).
- `canSpeak()`: `deps.speech.available()`.
- `canEditImages()`: the image server's edit slot, or the generate slot that
  the chat's `edit_image` falls back to, is ready (`isRoleReady`).
- `agents()`: `global.__lumaAgentManager.listAgents()` while the knowledge
  base service (`global.__lumaRagService`) exists, else `[]`.
- `ingest(agentId, files)`: Agent Manager's `AgentKnowledgeBase.ingest`
  (scope `agent:<id>`), one result per file.

Constructor seams: `globals`, `getAgentManager`, `getRag`, `makeKnowledge`.
Requires `extensions/agent-manager/AgentKnowledgeBase.js` lazily (a pure class),
so the per-agent scope convention stays in one place.
