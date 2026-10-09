# ServerCertificateProbe

`core/network-sharing/tls/ServerCertificateProbe.js`

Reads the certificate a TLS server presents, without trusting it, to capture
the material that becomes a peer's pin.

## Methods

- `ServerCertificateProbe.fetch(host, port, { timeoutMs = 6000 })` resolves to
  `{ certPem, fingerprint256 }`; rejects on timeout, socket error, or a server
  that presents no certificate.
- `ServerCertificateProbe.derToPem(der)` wraps DER bytes as a PEM certificate
  (64-character base64 lines).

## Why

Verification is deliberately off here: this is the trust-on-first-use moment
of pairing. Everything afterwards goes through [PinnedTls](PinnedTls.md).
