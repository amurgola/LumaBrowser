# PublicUrlProbe

`core/network-sharing/host/PublicUrlProbe.js`

Confirms the host's configured public URL (a domain or tunnel in front of the
web backend) really reaches this LumaBrowser instance.

## Methods

- `PublicUrlProbe.probe(publicUrl, { instanceId, fetch, timeoutMs = 10000 })`
  GETs `<publicUrl>/sharing/info` and resolves to `{ ok, status?, error? }`.
  Never throws. Failures, each with its own message: no URL, no fetch,
  timeout, connection error (with the underlying cause), 403 (the sharing
  origin policy is blocking the public origin), other HTTP errors, a body that
  is not this app's sharing endpoint, and a different instance id.
- `PublicUrlProbe.DEFAULT_TIMEOUT_MS`.

## Why

The instance id check means a stale DNS record or a tunnel pointing at some
other server counts as unreachable rather than a false pass. `fetch` is
injectable so this is testable without a network.
