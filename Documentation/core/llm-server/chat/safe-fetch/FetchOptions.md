# FetchOptions

`core/llm-server/chat/safe-fetch/FetchOptions.js`

Normalises a [SafeFetch](../SafeFetch.md) call's options and builds its request headers.

## Methods

- `FetchOptions.from(opts)` returns `{ timeoutMs, maxBytes, method, body, extraHeaders }`:
  - `timeoutMs` defaults to `DEFAULT_TIMEOUT_MS` (30000), `maxBytes` to `MAX_FETCH_BYTES` (512 KB);
  - `method` is the upper-cased method when it is letters only, else `GET`;
  - `body` is `String(opts.body)` for a non-GET/HEAD method with a body, else `null`;
  - `extraHeaders` keeps string-valued headers except `PROTECTED_HEADERS`
    (`user-agent`, `host`, `content-length`, `connection`, `transfer-encoding`, any casing).
- `FetchOptions.followsRedirects(options)`: true for GET and HEAD only.
- `FetchOptions.headers(options)`: `User-Agent` = `ChromeIdentity.USER_AGENT`,
  `Accept`, `Accept-Language: en-US,en;q=0.9`, the extra headers, then
  `ClientHintHeaders.rewrite` (client hints matching the UA).

## Why

Headless fetches present the same Chrome as the browser tabs: rotating stale
UAs, or a Chrome UA without its client hints, is itself a bot signal. Callers
(Tool Forge user tools) may add headers but never change that identity.
