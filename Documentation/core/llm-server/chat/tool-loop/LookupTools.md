# LookupTools

`core/llm-server/chat/tool-loop/LookupTools.js`

Classifies lookup calls: reads whose answer cannot change within one turn.

## Methods

- `isLookup(name)`: `web_search`, `search_knowledge_base` (`NAMES`).
- `isPageRead(name, params)`: a `web_search` with a non-blank `url`.
- `queryOf(name, params)`: the trimmed query of a search (`''` if missing),
  `null` for page reads and non-lookups.

## Why

Only lookups can be safely held back as repeats. Browser, artifact and MCP
tools read mutable state, so an identical repeat can return something new.
Opening a URL is a read, not a search, and research legitimately reads many
pages, so it never spends the search allowance.
