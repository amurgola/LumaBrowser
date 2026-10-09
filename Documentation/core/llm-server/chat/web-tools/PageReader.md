# PageReader

`core/llm-server/chat/web-tools/PageReader.js`

Gets one URL's readable text. Used by [WebLookup](../WebLookup.md) and the
game-mode [FetchGamedevDocTool](../../../../extensions/game-mode/tools/assets/FetchGamedevDocTool.md).

## Methods

- `PageReader.read(url, { timeoutMs?, tabRender?, fetcher? })` resolves
  `{ success: true, document }` or `{ success: false, error }`.
  `document`: `{ requestedUrl, url, text, viaBrowser, status?, rawCut,
  trimmedBlocks, fetchedAt }`, `text` already through
  [BoilerplateTrimmer](BoilerplateTrimmer.md).
- Statics: `HEADLESS_TIMEOUT_WITH_TAB_MS` (10 s), `RAW_BYTE_LIMIT` (3 MB),
  `MIN_RENDERED_CHARS` (120).

## Flow

1. Headless SafeFetch with the fixed byte cap; with a tab standing by and no
   timeout given, a 10 s timeout.
2. With a tab: an HTML response, or a failure
   [PageClassifier](PageClassifier.md)`.tabMightSucceed` allows, is rendered.
   More than 120 characters that are not a wall is the document.
3. Otherwise, in order: transport error ("Could not reach ...", plus
   `SEARCH_INSTEAD`), 404/410 ("does not exist", plus `SEARCH_INSTEAD`), other
   4xx/5xx ("was refused", plus `OTHER_SOURCE`), no readable text, a wall page.
   With a tab tried, refusals and walls add "a browser tab was turned away too".
4. Otherwise the headless text, with the final URL and whether the download was cut.

## Why

Headless is right for JSON, APIs and static pages; a script shell or a bot
block needs a real browser. A 404 never goes to the tab: dressing a missing
page up as success rewards URL guessing. Pages are now read whole and split
into parts later, so the raw cap no longer scales with a text budget: 3 MB
holds nearly any article's HTML while bounding memory. Static pages answer in a
few seconds, so with a tab as backup a slow headless attempt is cut at 10 s.
