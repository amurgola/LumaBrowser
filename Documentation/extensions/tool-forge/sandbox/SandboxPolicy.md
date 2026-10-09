# SandboxPolicy

`extensions/tool-forge/sandbox/SandboxPolicy.js`

The soft rules a user tool is bound by, on top of the hard boundaries
(Chromium sandbox, network-cancelled renderer, SafeFetch SSRF guard).
`hostAllowed` is the real exfiltration bound; redaction is best effort.

## Methods (all static)

- `parseHttpUrl(url)`: parsed http(s) URL or null.
- `normalizeHostPattern(entry)`: bare lowercase host from a host or URL;
  strips scheme, port, path and a leading `*.`.
- `hostAllowed(url, allowedHosts)`: exact host or a subdomain of a pattern
  (`github.com` covers `api.github.com`, never `notgithub.com` or
  `github.com.evil.com`); non-http(s) is refused; an empty list allows nothing.
- `clampTimeout(ms)`: into `MIN_TIMEOUT_MS` (5000) .. `MAX_TIMEOUT_MS` (30000),
  `DEFAULT_TIMEOUT_MS` (15000) when absent or invalid.
- `capText(text, maxBytes = MAX_RESULT_BYTES)` (256 KB of chars) -> `{ text, truncated }`.
- `redactSecrets(text, secrets)`: each `{ key, value }` with a value of at
  least `MIN_SECRET_LENGTH` (4) chars becomes `[REDACTED:<key>]` everywhere.
