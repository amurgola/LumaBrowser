# SendWebhookTool

`core/llm-server/chat/SendWebhookTool.js`

The agent's `send_webhook` tool: the one general-purpose outbound write the chat
agent has.

## Methods

- `new SendWebhookTool({ fetchImpl = fetch, timeoutMs = 15000 })`: both are test seams.
- `execute({ url, payload?, body?, method?, headers? })` resolves to
  `{ success: true, status, response, message }` or
  `{ success: false, error, status?, response? }`; it never rejects.
  - `url` must be http(s); `method` POST (default), PUT or PATCH, case-insensitive.
  - `payload` (or its alias `body`): an object is sent as JSON, a string verbatim
    as `text/plain; charset=utf-8`, nothing as `{}`. An unserialisable object is
    refused before calling out.
  - `headers`: string or number values pass through lowercased, except the
    transport-owned `host`, `content-length`, `transfer-encoding`, `connection`.
  - Redirects are followed. The reply body is cut to `MAX_RESPONSE_CHARS` (500).
    A non-2xx answer fails with `the endpoint answered <status>: <snippet>`.
    A timeout fails with `timed out after <n>s`.
- Constants: `TIMEOUT_MS`, `MAX_RESPONSE_CHARS`, `METHODS`, `BLOCKED_HEADERS`.

## Why

It is the "then that" half of if-this-then-that automations: a scheduled task
fetches a fact, then `send_webhook` delivers it to the user's automation endpoint.

Deliberate differences from the read path (safeFetch): it writes, never GETs, and
private, LAN and loopback addresses are allowed. The canonical targets are local
automations (Home Assistant, n8n, a dev server) and the URL comes from the user's
own instruction, not from page content, so the SSRF posture the read path needs
does not apply. The tool ships in the default-off `programmatic` group precisely
because it can call out.

Strings are sent verbatim because ntfy-style and Slack-compatible text hooks take
raw text. The response snippet is enough for an ack, an id or an error, never a
whole page.
