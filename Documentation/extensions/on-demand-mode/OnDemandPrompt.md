# OnDemandPrompt

`extensions/on-demand-mode/OnDemandPrompt.js`

The system prompt for the On Demand per-tab page agent, in four XML blocks:
`<on_demand>`, `<current_page>`, `<how_to_act>`, `<reply_style>`.

## Methods

- `OnDemandPrompt.build(data = {}, opts = {})`: `data` is the conversation's
  mode meta `{ tabId, url, title }` (fallbacks `the current tab`, `(unknown)`,
  `(untitled)`; url and title have `<`, `>`, `&` escaped). Rule 8
  (`search_knowledge_base`) is added only when `opts.kbDocs > 0`. Lines are
  joined with single newlines, no blank lines.

## Why small

The model is usually a local quantized one answering a spoken command while
the user waits; the long-form patterns live in the knowledge base.
