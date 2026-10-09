# WebLookup

`core/llm-server/chat/WebLookup.js`

The chat agent's headless `web_search` tool. A `query` searches; a `url` (an
address or a result number) reads a page, one part at a time.

## Methods

- `WebLookup.run({ params, tabRender?, ctxPerSlot?, session?, fetcher? })`
  resolves `{ success: true, message, ... }` or `{ success: false, error }` and
  never throws.
  - `params` is parsed by [LookupRequest](web-tools/LookupRequest.md)
    (`query`, `url`, `find`, `part`, `timeout`, `link` / `result`).
  - search -> [SearchRunner](web-tools/SearchRunner.md); rows are remembered in
    `session.results`.
  - read -> `session.pages` ([PageCache](web-tools/PageCache.md)) or
    [PageReader](web-tools/PageReader.md), then
    [PageReport](web-tools/PageReport.md) with a part size from
    [ReadBudget](web-tools/ReadBudget.md).
- `tabRender`: the run's [SilentTab](web-tools/SilentTab.md) function (absent
  without a browser). `session`: the run's [WebSession](web-tools/WebSession.md);
  a throwaway one is used without it. `fetcher` replaces `SafeFetch.fetch` (tests).
- `NEAR_MATCH_SIMILARITY` (0.8).

## Flow of a read

1. A result number resolves through the session; a missing one fails with the
   valid range, or with "search first" when nothing was searched.
2. The page comes from the session cache when fresh, else from PageReader
   (cached on success only).
3. A typed (not numbered) URL that fails and is at least 0.8 similar to a
   remembered result is read once as that result, with a preface saying so.
4. The follow-up handle in the continuation footer is the result number when
   one was used, so the model never retypes a long address.

## Why

A lightweight lookup beside the browser tools that never takes focus. Headless
traffic goes through [SafeFetch](SafeFetch.md), which refuses private and
IP-literal targets. Every path returns a model-readable result, because the
agent loop must not die on a bad page. 0.8 similarity accepts a misspelt slug
or a wrong year in a long URL but not a different page on the same site.
