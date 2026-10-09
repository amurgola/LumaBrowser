# SandboxNetBridge

`extensions/tool-forge/sandbox/SandboxNetBridge.js`

The sandbox's only network.

## Methods

- `new SandboxNetBridge({ getLiveApi, safeFetch })`.
- `handle({ callId, op, params }, active)`:
  - no active call or another `callId`: `No active tool call for this request.`
  - `params.url` not covered by `active.allowedHosts`
    ([SandboxPolicy](SandboxPolicy.md)`.hostAllowed`): `This tool is not
    allowed to reach "<url>". Its declared hosts are: <list or (none declared)>.`
  - `fetch`: `safeFetch(url, { method, headers, body, timeoutMs (finite only),
    maxBytes: FETCH_MAX_BYTES (2 MB) })` -> `{ success, ok, status, url,
    headers (at most FETCH_MAX_HEADERS = 24 string headers, or content-type),
    body, truncated }`; a failure -> `{ success: false, error, status }`;
    no fetch -> `fetch is not available.`
  - `fetchPage`, `openTab`: the LiveApi (`Browser bridge is not available.`
    without one).
  - otherwise `Unknown network op "<op>".`

## Why

safeFetch is the SSRF guard (private and IP-literal targets refused) and the
host allowlist is the exfiltration bound; the header subset keeps the wire
envelope (a leak vector) away from the tool.
