# SharingHostService

`core/network-sharing/host/SharingHostService.js`

The host side of Network Sharing: the enable toggle, PIN pairing, share
toggles, issued tokens, share links, the resource manifest and the listeners
(TLS, web backend, GPU lender). [SharingRouter](routes/SharingRouter.md) calls
back into it for auth, manifest and proxy targets. A facade: the work lives in
the collaborators linked below.

## Construction

`new SharingHostService({ db, getPort, getChatRouter, getImageRouter,
llmServerService, imageServerService, voiceServices, notifier, mcpAggregator,
apiSecurity, discovery, getAgentManager, getAppVersion })`

- `db` (required): the SettingsDatabase; throws `SharingHostService requires a SettingsDatabase` without it.
- `getChatRouter` / `getImageRouter` default to `global.__lumaChatRouter` /
  `global.__lumaImageRouter`; `getAgentManager` to `global.__lumaAgentManager`.
- `apiSecurity.isValidKey(key)` lets a configured core API key stand in for a
  pairing token. `notifier(info)` is called once per newly paired client.
- New injection points: `discovery` (NetworkDiscovery shape, for tests),
  `getAgentManager`, `getAppVersion` (defaults to `electron.app.getVersion()`, null outside Electron).
- Public fields kept from legacy: `enabled` (the in-memory flag; tests and
  callers may set it), `instanceId`, `tokens` ([TokenStore](../TokenStore.md)),
  `shares` ([ShareStore](../ShareStore.md)), `usage` ([UsageStore](../UsageStore.md)).

## Methods

Config and lifecycle:
- `isEnabled()`, `getPort()` (falls back to 3000), `getInstanceName()`,
  `getBindMode()`, `getShareFlags()`, `getAppVersion()`.
- `getInfo()`: the `/sharing/info` body `{ name, id, proto: 1, requiresPin: true, enabled, version, tls }`.
- `getConfig()`: everything the settings UI shows; never the raw PIN.
- `setEnabled(enabled)`: enabling needs a PIN (else reverts and returns
  `Set a PIN before enabling Network Sharing.`), then advertises over mDNS and
  starts TLS and (if on) the web backend; a failed bind only warns. Disabling
  stops the advert, both listeners and every GPU lend.
- `setPin(pin)` (4 to 8 digits; forgives lockouts, re-advertises),
  `clearPin()` (also disables), `setInstanceName(name)`, `setBindMode(mode)`,
  `setShareFlag(flag, value)` (unknown flag fails; turning `shareGpus` off
  releases a live lend immediately).
- `setRpcLending(s)`, `getRpcLending()`, `setTlsServer(s)`, `getTlsPort()`,
  `setTlsPort(port)` (validates, rebinds live), `getTlsInfo()` (`{ port,
  fingerprint256 }` or null while TLS is not serving).
- `setWebServer(s)`, `registerWebMount(prefix, handlers)` (unregister
  function, no-op without a web server), `isWebEnabled()`, `isWebRunning()`,
  `getWebPort()`, `getWebConfig()`, `setWebEnabled(enabled)` (pending while the
  host is off; a failed bind reverts the toggle), `setWebPort(port)`,
  `getWebPublicUrl()`, `setWebPublicUrl(url)`, `checkPublicUrlReachable({ fetch, timeoutMs })`
  (`{ skipped: true }`, or `{ ok, publicUrl, error? }` via [PublicUrlProbe](PublicUrlProbe.md)).
- `getWebAllowedTools()`, `setWebAllowedTools(tools)` ([WebToolAllowList](WebToolAllowList.md)).

Tokens, pairing and usage:
- `listTokens()` (usage joined), `revokeToken(id)`, `removeToken(id)` (drops
  its usage), `revokeAllTokens()`, `verifyToken(token)`.
- `verifyCredential(token)`: a pairing-token entry, or `{ id: 'api-key',
  label: 'Core API key', viaApiKey: true }` for a valid API key, else null.
- `recordUsage(entry, delta)`: skips API-key and id-less entries.
- `pair(pin, { ip, peerHint })` ([PinPairing](PinPairing.md)), `setNotifier(fn)`.

Share links ([ShareLinkPublisher](ShareLinkPublisher.md)):
- `getShareLinkStatus()`, `createShareLink({ kind, targetId, title })`,
  `resolveShare(token)`, `listShareLinks()`, `revokeShareLink(id)`,
  `revokeAllShareLinks()`, `lanAddress()`.

Manifest and proxy targets:
- `buildManifest()` ([HostManifestBuilder](HostManifestBuilder.md)),
  `allowedLlmRefs()`, `imageModelDenied(role, modelId)`
  ([HostModelInventory](HostModelInventory.md)), `hostDialPosition()`
  ([HostDialPosition](HostDialPosition.md)).
- `getChatRouter()`, `getImageRouter()`, `getChatStore()`,
  `getVoiceServices()`, `getAgentManager()`.
- `enqueueImage(fn)`: FIFO over one key of
  [FileMutationQueue](../../shell/FileMutationQueue.md); a failed job never wedges the queue.
- `shutdown()`: stops the advert and every listener, swallowing errors.

## Collaborators

[HostSettings](HostSettings.md) (persisted keys), [HostListeners](HostListeners.md),
[HostAdvertiser](HostAdvertiser.md), [PinPairing](PinPairing.md),
[ShareLinkPublisher](ShareLinkPublisher.md), [LanAddress](LanAddress.md),
[WebToolAllowList](WebToolAllowList.md), [HostManifestBuilder](HostManifestBuilder.md),
[HostModelInventory](HostModelInventory.md), [HostDialPosition](HostDialPosition.md).

## Why

The router stays mounted and every handler checks `isEnabled()`, so toggling
sharing never rebinds a port. Sharing with no PIN is never allowed; the PIN
lockout is what makes a 4-digit PIN safe on a LAN.
