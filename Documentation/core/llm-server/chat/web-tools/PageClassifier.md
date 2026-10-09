# PageClassifier

`core/llm-server/chat/web-tools/PageClassifier.js`

Says what fetched text really is. Used by the web lookup and
[LivePageFetch](../live-api/LivePageFetch.md).

## Methods (static)

- `isChallenge(text)`: a bot wall: at most `WALL_MAX_CHARS` (8,000) and
  containing a `WALL_PHRASES` marker (Cloudflare, DuckDuckGo anomaly, captcha...).
- `isNothingFound(text)`: an engine's explicit "no results" (`NOTHING_FOUND_PHRASES`).
- `isProse(text)`: at least `PROSE_MIN_CHARS` (400) and `PROSE_MIN_SENTENCES` (3)
  sentence ends.
- `tabMightSucceed(res)` (a SafeFetch result): a transport error other than an
  SSRF refusal, a 5xx, or one of `TAB_WORTHY_STATUSES` (401, 403, 406, 408, 425, 429).

## Why

A wall must never pass as content, and "found nothing" is an answer while a
wall is not. Walls are short, so the length bound keeps long articles that
mention captchas from matching. A browser tab may beat auth walls, rate limits
and outages, but never a 404/410 (no browser conjures a missing page) and never
a refused private address: the tab has no SSRF guard
([AddressGuard](../safe-fetch/AddressGuard.md)).
