# LookupRequest

`core/llm-server/chat/web-tools/LookupRequest.js`

Reads the model's `web_search` arguments into one validated request.

## Methods (static)

- `parse(params)` returns `{ kind: 'search' | 'read', query, url,
  resultNumber, find, part, timeoutMs }` or `{ problem }`.
  - A `url` (or a result number) makes it a read, even with a `query`.
  - Result numbers: `url` of `"3"` / `"#3"` (one or two digits), or
    `link` / `result`. `url` is then `''`.
  - `part`: absent or `''` is 1; a whole number from 1 (numeric strings too);
    anything else is `BAD_PART`.
  - `timeout` (ms, numbers only) is held to `MIN_TIMEOUT_MS` .. `MAX_TIMEOUT_MS`.
- `MISSING_TARGET`, `BAD_PART`: the problem texts.

## Why

Validation happens before any network work, so a malformed call costs nothing.
Timeout bounds: under 2 s a slow TLS handshake alone fails; past 45 s the chat
turn stalls longer than switching to another source would cost.
