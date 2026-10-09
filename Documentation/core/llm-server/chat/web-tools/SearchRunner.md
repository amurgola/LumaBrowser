# SearchRunner

`core/llm-server/chat/web-tools/SearchRunner.js`

Runs one web search over a ladder of sources.

## Methods

- `SearchRunner.run(query, { timeoutMs?, tabRender?, fetcher?, partChars? })`
  resolves one of:
  - `{ success: true, results, message }` from [ResultList](ResultList.md);
  - `{ success: true, results: [], message }`: an engine said nothing matched;
  - `{ success: true, message }`: an unparsed results page as text (first part);
  - `{ success: false, error }`: no engine answered; points at searching by
    hand with the browser tools.
- Statics: `ENOUGH_RESULTS` (3), `ENGINE_PAGE_BYTES` (1 MB),
  `MIN_RENDERED_CHARS` (200), `FAILURE_NEXT_STEP`.

## Flow

Sources in order: DuckDuckGo in the [SilentTab](SilentTab.md) (only with a
browser), headless [DuckDuckGoEngine](DuckDuckGoEngine.md), headless
[BingEngine](BingEngine.md). The ladder stops once the list holds 3 distinct
results; an engine that already gave rows is not asked again. A source that
throws, errors (HTTP 400+) or shows a wall
([PageClassifier](PageClassifier.md)) yields nothing. A page without rows is
noted as "nothing found" or kept as the readable fallback.

## Why

A real tab carries the persistent session, so rapid queries look like one
returning visitor. One or two results leave no fallback when the top hit is
blocked, so a thin list is topped up from the next engine (de-duplicated),
while a full list is not worth another engine's latency. "Nothing found" is
reported as success because, reported as a failure, it sent the model round
the same dead-end query when "it does not exist as written" was the answer.
