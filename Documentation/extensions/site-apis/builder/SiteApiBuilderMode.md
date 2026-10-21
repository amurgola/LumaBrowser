# SiteApiBuilderMode

`extensions/site-apis/builder/SiteApiBuilderMode.js`

The `site-api-builder` chat mode (label "Site API", plug icon, sidebar launcher, agent on). A builder
conversation records, compiles, tests and saves the endpoints of one site. Each turn binds the conversation to
its site, keeps one visible work tab open in the site's session partition, pins the agent to that tab and hands
it the page tools plus the builder tools.

## Conversation meta

`meta.data = { partition, origin, startUrl, sourceTabId?, siteId?, workTabId?, endpointId?, recording?, returnsDeclared? }`.
The opener (settings page "New site API", tab menu "Create Site API from this tab") creates the conversation
with mode `site-api-builder` and data `{ partition, origin, startUrl, sourceTabId }`, or `{ siteId }` for an
existing site. A conversation started from the sidebar has no data: the turn is "unbound" and only offers
`list_persisted_tabs` and `use_tab`, with no browser, until the model binds it.

## Methods

- `new SiteApiBuilderMode({ service, browser, getChatStore, logger, workTabs? })`: `service` is the
  SiteApiService; `browser` is `context.browser` or null; `getChatStore` is late-bound (the router boots after
  the extension).
- `descriptor()`: `{ id, label, icon, description, requirements: ['llm'], launcher: 'sidebar', agent: true, buildTurn, onConversationDeleted }`.
- `buildTurn({ meta, conversationId })`: resolves the site through [SiteBinding](SiteBinding.md) (creating the
  record once per partition + origin, then reusing it and pointing its `conversationId` here), ensures the work
  tab through [WorkTabs](WorkTabs.md), persists `siteId` and `workTabId` in the meta, and answers
  `{ systemPrompt, temperature: 0.2, agent: true, tools, allowedTools: PAGE_TOOLS + builder tools, workTabId, agentBudget: { maxIterations: 40 } }`.
  Without a browser the turn carries `noBrowser: true` and the prompt says demonstration needs it.
- `onConversationDeleted({ conversationId, meta })`: closes the work tab and clears the site's
  `conversationId` when it pointed here.
- `dispose()`: closes every work tab the mode opened.

## Decisions

- `PAGE_TOOLS` is OnDemandMode's list without `get_tabs` and `search_knowledge_base`; `navigate` stays so a flow
  can start from a deep link. No `create_tab`: one tab per conversation.
- The work tab is visible (not hidden) and opened with `activate: false`, so the user can watch the
  demonstration without losing focus; the replay runner uses its own hidden tab in the same partition.
- A stale `siteId` (site deleted) is dropped from the meta and the turn falls back to the unbound prompt.
