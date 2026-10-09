# SafeFetch

`core/llm-server/chat/SafeFetch.js`

SSRF-hardened HTTP(S) fetch for the agent's headless web tools (web search and
page fetch, live artifacts, Tool Forge user tools). Only public addresses are
reachable; it never throws for a network or SSRF failure.

## Methods

- `SafeFetch.fetch(url, { timeoutMs?, maxBytes?, method?, headers?, body? })`
  resolves `{ ok: true, status, finalUrl, contentType, body, truncated }` or
  `{ ok: false, error }`. Errors: `Invalid URL: <url>`,
  `Unsupported URL scheme "<scheme>" (only http/https).`,
  the bare transport reason (e.g. `ECONNRESET`,
  `blocked non-public address <ip> for <host>`, `Timed out after <n>s`),
  `Too many redirects.`, `Bad redirect target.`, `Read error: <reason>`.
- `SafeFetch.MAX_REDIRECTS` (5), `SafeFetch.MAX_FETCH_BYTES` (512 KB).

Options are normalised by [FetchOptions](safe-fetch/FetchOptions.md): 30 s
timeout, GET unless a valid method is given, the body only for non-GET/HEAD,
and the app's Chrome identity in the headers.

## Why

An LLM, or a page it was told to read, can hand the tool a URL that resolves to
loopback, the LAN or the cloud metadata endpoint `169.254.169.254`. Defences:

- [AddressGuard](safe-fetch/AddressGuard.md)`.lookup` replaces DNS lookup for
  the socket, so the address checked is the one connected to (no
  DNS-rebinding window).
- IP-literal hosts are checked before the request, because Node never calls
  `lookup` for a literal.
- Redirects are followed by hand, each hop a fresh guarded request; only GET
  and HEAD follow redirects, so a POST is never replayed at a new target (the
  3xx is returned instead).
- A byte cap ([CappedBodyReader](safe-fetch/CappedBodyReader.md)) and a
  per-request timeout.
