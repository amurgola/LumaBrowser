# SharingHostService

`core/network-sharing/host/SharingHostService.js`

The host side of Network Sharing: the enable toggle, PIN pairing, share
toggles, issued tokens, share links, the resource manifest and the listeners
(TLS, web backend, GPU lender). [SharingRouter](routes/SharingRouter.md) calls
back into it for auth, manifest and proxy targets. A facade: the work lives in
the collaborators linked below.

## Construction

`new SharingHostService({ db, getPort, getChatRouter, getImageRouter,
getVideoRouter, llmServerService, imageServerService, voiceServices, notifier,
mcpAggregator, apiSecurity, discovery, getAgentManager, getAppVersion })`

- `db` (required): the SettingsDatabase; throws `SharingHostService requires a SettingsDatabase` without it.
- `getChatRouter` / `getImageRouter` / `getVideoRouter` default to
  `global.__lumaChatRouter` / `global.__lumaImageRouter` /
  `global.__lumaVideoRouter`; `getAgentManager` to `global.__lumaAgentManager`.
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
  `getBindMode()`, `getShareFlags(credential?)` (the master flags, or one
  credential's once its user's overrides apply: [AccessPolicy](AccessPolicy.md)),
  `getAppVersion()`.
- `getInfo()`: the `/sharing/info` body `{ name, id, proto: 1, requiresPin: true, enabled, version, tls }`.
- `getConfig()`: everything the settings UI shows, including `users`; never
  the raw PIN or a user's key.
- `setEnabled(enabled)`: enabling needs a PIN (else reverts and returns
  `Set a PIN before enabling Network Sharing.`), then advertises over mDNS and
  starts TLS and (if on) the web backend; a failed bind only warns. Disabling
  stops the advert, both listeners and every GPU lend.
- `setPin(pin)` (6 to 8 digits, else `PIN must be 6 to 8 digits.`; forgives
  lockouts, re-advertises),
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
- `getWebAllowedTools(credential?)`, `setWebAllowedTools(tools)`, `getSharedTurnTools(credential?)` ([WebToolAllowList](WebToolAllowList.md)); a user with their own tool list gets that list instead of the master one. `getWebConfig()` also carries `webDefaultTools`, what applies while nothing was chosen.

Tokens, pairing and usage:
- `listTokens()` (usage joined), `revokeToken(id)`, `removeToken(id)` (drops
  its usage), `revokeAllTokens()`, `verifyToken(token)`.
- `verifyCredential(token)`: a pairing-token entry, a user's credential
  (`{ id, label, peerHint, kind, viaUser: true, overrides }`, from
  [SharingUsers](SharingUsers.md)), or `{ id: 'api-key', label: 'Core API key',
  viaApiKey: true }` for a valid API key, else null.
- `recordUsage(entry, delta)`: skips API-key and id-less entries.
- `pair(secret, { ip, peerHint })`: a PIN pairs a new device
  ([PinPairing](PinPairing.md)); a user's access key (`lumauser_...`) signs in
  as that user and answers `{ success, token: <the key>, name, user }`.
  `setNotifier(fn)`.

- `mediaPicksFor(credential, picks)`: the image, edit and video models a shared agent turn's media tools run on:
  the client's picks, and for a user with an image model list only models on it (their pick, else the slot's
  current model, else the first allowed).

Users ([SharingUsers](SharingUsers.md)):
- `listUsers()`, `createUser({ name, kind })`, `updateUser(id, fields)`,
  `setUserOverrides(id, overrides)`, `rotateUserKey(id)`, `removeUser(id)`,
  `userLoginLink(id)`.
- `permissionCatalog()`: what a user's overrides can name, whatever the master
  toggles say: `{ llms: [{ ref, label, kind }], imageModels: [{ id, label,
  kinds }], shareFlags, toolGroups }`.

Share links ([ShareLinkPublisher](ShareLinkPublisher.md)):
- `getShareLinkStatus()`, `createShareLink({ kind, targetId, title })`,
  `resolveShare(token)`, `listShareLinks()`, `revokeShareLink(id)`,
  `revokeAllShareLinks()`, `lanAddress()`.

Manifest and proxy targets:
- `buildManifest(credential?)` ([HostManifestBuilder](HostManifestBuilder.md),
  with the credential's flags, then narrowed to its user's models),
  `allowedLlmRefs(credential?)`, `imageModelDenied(role, modelId, credential?)`
  ([HostModelInventory](HostModelInventory.md); a user with an image model list
  is held to it even when no model is named, since the host default runs then),
  `hostDialPosition(modelRef?)`
  ([HostDialPosition](HostDialPosition.md)).
- `getChatRouter()`, `getImageRouter()`, `getVideoRouter()`, `getChatStore()`,
  `getVoiceServices()`, `getAgentManager()`.
- `enqueueImage(fn)` / `enqueueVideo(fn)`: FIFO over one key each (`image`,
  `video`) of [FileMutationQueue](../../shell/FileMutationQueue.md); a failed
  job never wedges a queue, and a long clip never holds up image requests.
- `shutdown()`: stops the advert and every listener, swallowing errors.

## Collaborators

[HostSettings](HostSettings.md) (persisted keys), [HostListeners](HostListeners.md),
[HostAdvertiser](HostAdvertiser.md), [PinPairing](PinPairing.md),
[ShareLinkPublisher](ShareLinkPublisher.md), [LanAddress](LanAddress.md),
[WebToolAllowList](WebToolAllowList.md), [HostManifestBuilder](HostManifestBuilder.md),
[HostModelInventory](HostModelInventory.md), [HostDialPosition](HostDialPosition.md).

## Why

The router stays mounted and every handler checks `isEnabled()`, so toggling
sharing never rebinds a port. Sharing with no PIN is never allowed; the
[PairingThrottle](PairingThrottle.md) lockouts are what keep a short PIN from
being guessed, even behind a proxy that hides callers' addresses.
