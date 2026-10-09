# HostListeners

`core/network-sharing/host/HostListeners.js`

Holds the listeners the sharing host controls: the TLS listener
(`TlsSharingServer`), the web backend (`WebAppServer`) and the GPU lender
(`RpcLendingService`). Each is injected later by main.js; every call is a
no-op while it is absent.

## Methods

- `setTlsServer(s)`, `setWebServer(s)`, `setRpcLending(s)`, `hasTlsServer()`,
  `hasWebServer()`, `getRpcLending()`.
- `startOnEnable({ tlsPort, webPort, webEnabled })`: starts TLS, and the web
  backend when `webEnabled`; a failed bind warns `[sharing] TLS listener start
  failed:` / `web app start failed:` and continues.
- `stopOnDisable()`: stops TLS and web, then releases the GPU lend (errors swallowed).
- `shutdown()`: stops all three, swallowing every error.
- `startTls(port)`, `isTlsRunning()`, `tlsFingerprint()`, `tlsInfo()` (`{ port,
  fingerprint256 }` or null while not serving).
- `startWeb(port)`, `stopWeb()`, `isWebRunning()`, `registerWebMount(prefix, handlers)`
  (a no-op unregister function without a web server).
- `gpuLendSupported()`, `gpuLendStatus()` (`{ active: false }` without a lender),
  `releaseGpusNow()` (fire and forget, errors swallowed).
