# OnDemandMode

`extensions/on-demand-mode/OnDemandMode.js`

The hidden `on-demand` chat mode descriptor: every turn pins the chat agent
to the user's own tab, limits it to the page tools and points
`search_knowledge_base` at the `webnav` scope.

## Methods

- `new OnDemandMode(knowledgeBase)` (needs `docCount()`).
- `descriptor()` -> `{ id: 'on-demand', label: 'Luma On Demand', description,
  requirements: ['llm'], hidden: true, agent: true, buildTurn }`. Hidden: only
  the Live panel creates its conversations.
- `buildTurn({ meta, modelRef = null })` -> `{ systemPrompt, temperature: 0.2,
  agent: true, allowedTools (a copy of ALLOWED_TOOLS), workTabId,
  agentBudget: { maxIterations: 12 }, kbScope: 'webnav', modelRef }`.
  `workTabId` is `Number(meta.data.tabId)` when finite, else null (lazy tab).
- `OnDemandMode.MODE_ID`, `ALLOWED_TOOLS` (frozen: page read/act tools,
  `navigate`, `get_tabs`, `search_knowledge_base`; no `create_tab`, artifacts,
  images or web search).
