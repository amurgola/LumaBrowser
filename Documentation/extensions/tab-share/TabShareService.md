# TabShareService

`extensions/tab-share/TabShareService.js`

The tab shares themselves, an EventEmitter. A share binds an unguessable
token to one browsing tab; sharing also persists the tab (keep-alive), so
closing it hides rather than destroys it and the link keeps working. Links
resolve only while the Network Sharing web backend can serve them (the same
rule as `/share` links): turning sharing or the web backend off kills every
tab link at once, and turning them back on revives the same URLs.

## Methods

- `new TabShareService({ db, browser, getHost, log, extensionDir, rtcCapturer, turnRelay })`.
- `start({ router, upgrade })`: loads shares and settings, starts the relay if
  on, listens to the TabViewManager (`tabCreated`, `tabClosed`,
  `tabNavigated`, `tabTitleUpdated`), binds already-live tabs, and mounts
  `/tab` with `host.registerWebMount` (logged when unavailable). Idempotent.
- `destroy()`: ends every streamer, the capturer and relay, unhooks and
  unmounts.
- `availability()` -> `{ available, reason, baseUrl }` from
  `host.getShareLinkStatus()`.
- `getStatus()` -> `{ available, reason, shares, settings, rtc }`.
- `getSettings()`, `updateSettings(patch)` -> `{ success, settings, relay }`
  or `{ success: false, error }`; `turnHost()`, `rtcAvailable()`.
- `getForTab(tabId)`, `share(tabId, { mode })`, `setMode(shareId, mode)`,
  `stop(shareId)`, `stopAll()`. Public share shape: `{ id, tabId, live, mode,
  url, pageUrl, title, viewers, videoViewers, createdAt }`.
- `resolve(token)`, `resolveStreamer(token)`, `viewerCount(id)`, `videoViewerCount(id)`.
- Emits `changed` `{ reason, shareId, status }`; reasons `shared`, `mode`,
  `stopped`, `bound`, `dormant`, `meta`, `viewers`, `settings`.

## Rules

- Mode must be `view` or `interact`. Only regular browsing tabs (kind `user`,
  not silent) can be shared. Sharing an already shared tab only changes its
  mode (same link).
- `resolve` checks the token shape first, then availability; a dormant share
  resolves (the viewer page waits), but has no streamer.
- `stop` un-persists the tab only if sharing persisted it and it is still in
  the strip: un-persisting a hidden tab would destroy it.
- A closed tab leaves its share dormant. A kept-alive tab created later binds
  the dormant share in its partition with the same URL, or the only one there.
