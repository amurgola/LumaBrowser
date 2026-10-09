# HostCertificate

`core/network-sharing/tls/HostCertificate.js`

The sharing host's app-managed self-signed TLS identity.

## Methods

- `HostCertificate.getOrCreate({ dir, commonName })` returns
  `{ dir, keyPem, certPem, fingerprint256 }`, loading the pair from `dir`
  (default `<userData>/sharing-tls`) or generating it. Cached per directory.
- `HostCertificate.fingerprintOf(certPem)` returns the colon-separated SHA-256
  fingerprint.
- `HostCertificate.resetCache()` drops the cache (tests).

## Why

The certificate is never installed into an OS trust store. Trust is pinning:
a client records the fingerprint at pair time (trust on first use, like SSH
host keys) and checks it on every later connection, identically on every OS.

So the identity must be stable: the pair persists and is only regenerated
when missing, unreadable, mismatched with its key, or within 30 days of
expiry (so no handshake ever fails on dates alone). After a regeneration,
paired clients must re-pair; that is expected pinning behaviour.

Generation uses `selfsigned` (pure JS), so no openssl binary is needed. RSA-2048
keeps it to a few hundred milliseconds, and it only runs on first enable or
renewal. The key file is written with mode 0600.
