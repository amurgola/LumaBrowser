# LivePageFetch

`core/llm-server/chat/live-api/LivePageFetch.js`

Reads one page for a live artifact and returns its RAW content for the widget to
parse.

## Methods

- `new LivePageFetch({ fetcher, tabFetch? })`: `fetcher` is
  [SafeFetch](../SafeFetch.md)`.fetch` (or a test double); `tabFetch` is a
  [SilentTab](../web-tools/SilentTab.md) function or null without a browser.
- `execute(request)` with a [LivePageRequest](LivePageRequest.md):
  1. Headless fetch with `timeoutMs` (default `HEADLESS_TIMEOUT_MS`, 12 s) and
     `maxBytes = maxChars * 8` clamped to 512 KB - 4 MB.
  2. The browser tab is tried when a tab exists and the response is HTML
     ([ResponseText](../web-tools/ResponseText.md)`.isHtml`; it may be a JS
     shell), a bot-check ([PageClassifier](../web-tools/PageClassifier.md)`.isChallenge`),
     or a failure `PageClassifier.tabMightSucceed` accepts (transport error, 5xx,
     401/403/406/408/425/429), but never a 404/410 and never a non-public
     refusal (all decided by `PageClassifier.tabMightSucceed`). `html` mode asks the tab for `full`. A
     non-empty, non-challenge tab result wins: `{ ..., viaBrowser: true }`.
  3. Otherwise from the headless response: transport error (`res.error` or
     `fetch failed`); `HTTP <status>` with `status` for 400+; `The site answered
     with a bot-check/challenge page instead of content.`; `html` mode returns
     the body verbatim; `markdown`/`text` convert HTML via `ResponseText.toText` (relative links made absolute)
     and pass JSON or plain text through unchanged; both add `status`.
  Success is `{ success: true, url, content, truncated, totalChars, ... }`,
  `content` cut to `maxChars` with the true total reported.

## Why

Headless first is right for JSON, APIs and static pages; a silent tab renders
JavaScript, applies ad-blocking and carries the app's Chrome identity and
cookies, so it beats JS shells and many bot checks. A browser cannot make a
missing page exist, so 404/410 never retry. The tab has no SSRF guard of its
own, so a target SafeFetch refused as non-public must never be retried there.
