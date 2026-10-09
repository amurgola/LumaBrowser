# TlsSharingServer

`core/network-sharing/host/TlsSharingServer.js`

The HTTPS listener for the Network Sharing API. It mounts the same
[SharingRouter](routes/SharingRouter.md) at the same `/sharing` prefix as the
plain REST gateway mount, behind the app-managed self-signed certificate
([HostCertificate](../tls/HostCertificate.md)), so a paired client only swaps
origin. Extends [SharingListener](SharingListener.md).

## Methods

- `new TlsSharingServer({ hostService, getCredentials })`: `hostService` is the
  SharingHostService (throws without one). `getCredentials()` returns
  `{ keyPem, certPem, fingerprint256 }` and defaults to
  `HostCertificate.getOrCreate({ commonName: hostService.getInstanceName() })`.
- `start(port)` resolves `{ success, port, fingerprint256 }` or
  `{ success: false, error }`. A certificate that cannot be loaded (or has no key
  or cert) resolves `Could not load the sharing TLS certificate: <reason>`.
- `stop()`, `isRunning()`, `getPort()` from SharingListener.
- `getFingerprint()`: SHA-256 fingerprint (colon-separated) of the served
  certificate, null while not serving.
- The app parses JSON up to `TlsSharingServer.BODY_LIMIT` (`50mb`, the REST
  gateway's limit, because images ride as base64 JSON).

## Why

Its own port, not the gateway's: Node cannot serve http and https on one
socket, and the gateway port is load-bearing for the local UI. The plain mount
stays for `/sharing/info` discovery and for peers paired before TLS; new
pairings upgrade here and pin the certificate, encrypting LAN chat and image
traffic. Lifecycle is owned by SharingHostService through
[HostListeners](HostListeners.md): running iff sharing is enabled; a failed
start degrades sharing to plain HTTP.
