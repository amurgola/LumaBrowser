# BuilderLauncher

`extensions/site-apis/exposure/BuilderLauncher.js`

Opens the Site API builder chat (`ext.site-apis.openBuilder`) from the main process.

## How the conversation is created and shown

1. `chatStore.createConversation({ title: 'Site API: <site name or host>', toolsEnabled: true, mode: 'site-api-builder' })`
   through `ChatRouterDeps.chatStore()` (the UnifiedChatRouter's store, read per call).
2. `chatStore.setMeta(id, { mode: 'site-api-builder', data })` with
   `data = { partition, origin, startUrl, sourceTabId, siteId? }`, the shape `builder/BuilderMeta` reads.
3. `ExtensionGlobals.llmServerService().openConversation(id)`: `LLMServerService.openChat()` activates the pinned
   LLM tab (creating it if needed) and sends `core.llmServer.showChat`, then `core.llmServer.openConversation`
   with the id. The chat page's `ChatSubscriptions` turns that push into `conversation.open(id)`, which restores
   the mode from the conversation row and its meta. No new IPC channel was needed.

## Inputs

- `{ tabId }`: a persisted tab. Partition from `tabs.getEntry(tabId).partition` (default `persist:main`), origin
  and startUrl from the entry's URL (`SiteApiStore.originOf`; a non-http(s) page is an error). When a site already
  exists for that partition and origin the call edits it instead (as `{ siteId }` with `sourceTabId` = the tab).
- `{ siteId }`: reuses `site.conversationId` when `chatStore.getConversation` still finds it, else creates a new
  one and writes it back with `service.updateSite(siteId, { conversationId })`. `sourceTabId` is the persisted tab
  `SiteApiService.persistedTabFor` finds now, or null.

## Methods

- `new BuilderLauncher({ service, getChatStore?, getLlmServer?, getTabs? })`: the getters default to
  `ChatRouterDeps.chatStore()`, `ExtensionGlobals.llmServerService()` and no tabs; `getTabs` answers the TabViewManager.
- `open(input)`: `{ success: true, conversationId, siteId, created, opened }` or `{ success: false, error }`.
  `opened` is false when there is no pinned LLM tab (the conversation still exists).
- `BuilderLauncher.title(target)`.
