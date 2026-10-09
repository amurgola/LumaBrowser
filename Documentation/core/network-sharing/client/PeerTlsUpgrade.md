# PeerTlsUpgrade

`core/network-sharing/client/PeerTlsUpgrade.js`

Decides whether a plain-HTTP sharing host should be reached on its encrypted
listener instead, and pins its certificate on first use (TOFU).

## Methods

- `PeerTlsUpgrade.resolve(base, info)` returns one of:
  - `{ success: true }`: no upgrade. `base` is already https (public CA
    validation applies), or `info.tls` has no port (the host predates TLS).
  - `{ success: true, base: 'https://<host>:<tls port>', pin }`: the cert was
    captured with [ServerCertificateProbe](../tls/ServerCertificateProbe.md),
    matched against `info.tls.fingerprint256` when advertised, and registered
    with `PinnedTls.setPin`.
  - `{ success: false, error }`: TLS was advertised but the port could not be
    reached, or the presented cert does not match the advertised fingerprint.

## Why

Advertised TLS is mandatory. Falling back to plain HTTP when the encrypted port
fails would let an active attacker downgrade the link and read the PIN, so
both failures abort pairing. The upgrade happens before the PIN is sent.
