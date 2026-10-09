# SearchAllowanceCheck

`core/llm-server/chat/tool-loop/SearchAllowanceCheck.js`

Holds back a search once the turn's search allowance is spent. Extends
[LoopCheck](LoopCheck.md).

## Methods

- `new SearchAllowanceCheck(allowance = DEFAULT_ALLOWANCE)`; `allowance`.
- `spent(history)`: searches that ran, failures included.
- `inspectRequest(record, history)`: held with `{ allowance }` when a search
  is requested after `allowance` have run. Page reads are never held.
- `PATTERN` = `search-allowance`; `DEFAULT_ALLOWANCE` = 8.

## Why

One allowance is shared by web and knowledge-base searches, because both fill
the same context. A search result is roughly 1-2k tokens, so eight of them fill
the 12-16k that a small local model can actually reason over. Failed searches
count because each one still cost a step. URL reads are exempt because research
reads many pages.
