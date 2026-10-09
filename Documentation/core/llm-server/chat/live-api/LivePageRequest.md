# LivePageRequest

`core/llm-server/chat/live-api/LivePageRequest.js`

Validates and normalises a live artifact's `fetchPage` parameters.

## Methods (all static)

- `validHttpUrl(url)`: the parsed `href` when `url` is an absolute `http:` or
  `https:` URL, else null (`file:`, `javascript:`, `chrome:`, relative, junk).
- `from(params)`: null for a bad URL, else
  `{ url, mode, maxChars, timeoutMs }`: `mode` is `markdown` (default), `text`
  or `html`; `maxChars` via `clampChars`; `timeoutMs` clamped to 3-60 s when a
  finite number, else `undefined` (callers use their own default).
- `clampChars(n)`: `DEFAULT_MAX_CHARS` (60000) for a non-positive or
  non-numeric value, else the floor clamped to 1000-`MAX_CHARS_CEILING` (200000).
- Statics: `MODES`, `DEFAULT_MAX_CHARS`, `MIN_MAX_CHARS`, `MAX_CHARS_CEILING`,
  `MIN_TIMEOUT_MS`, `MAX_TIMEOUT_MS`.

## Why

Widgets parse content in-page, so the character budget is generous next to a
model context, but still bounded. Only http(s) URLs are ever reachable.
