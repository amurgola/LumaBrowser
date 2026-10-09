# PinnedTls

`core/network-sharing/tls/PinnedTls.js`

Process-wide registry of pinned TLS certificates for Network Sharing peers,
keyed by https origin (`https://host:port`).

## Methods

- `PinnedTls.setPin(url, { certPem, fingerprint256 })` registers or replaces
  a pin; false for a non-https URL or incomplete material.
- `PinnedTls.removePin(url)`, `PinnedTls.getPin(url)`, `PinnedTls.clearPins()`.
- `PinnedTls.agentFor(url)` returns the cached keep-alive `https.Agent`
  enforcing the pin for that origin, or null when the origin is not pinned
  (the caller then uses normal CA validation).
- `PinnedTls.sameFingerprint(a, b)` compares ignoring colons, whitespace and
  case; never true for empty input.
- `PinnedTls.originOf(url)` returns `https://host:port` (port defaults to
  443) or null for anything that is not https.

## Why

A LAN peer's self-signed certificate cannot be validated through any CA. The
pinned PEM becomes the sole trust anchor (`ca`) and `checkServerIdentity`,
which would fail against a bare LAN IP, is replaced by a strict fingerprint
comparison. `rejectUnauthorized` stays true, so a mismatch on either check
kills the connection (fail closed). Public HTTPS endpoints (a reverse proxy)
are never pinned and keep normal validation.

Keying by origin means one pin covers pairing, manifest polls, the
OpenAI-compatible LLM proxy and the remote image adapter. Pins are in memory;
SharingClientService reloads them from its persisted peers at startup.
