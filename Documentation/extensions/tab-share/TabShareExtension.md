# TabShareExtension

`extensions/tab-share/TabShareExtension.js`

Main-process side of Tab Share: right-click a tab, "Share tab", and a public
link on the Network Sharing web backend streams it to whoever opens it. A
`view` link watches; an `interact` link also clicks, scrolls and types.
Two transports: an always-available JPEG frame feed over the guest's
WebSocket, and an optimized WebRTC stream the guest upgrades to when it can,
with the host's own TURN relay for guests outside the network.

## Methods

- `new TabShareExtension({ electron, getHost })`: both for tests; `getHost`
  defaults to `global.__lumaSharingHostService` (a core singleton, not on the
  extension context, as for game-mode's share links).
- `activate(context)`: builds a [TabShareService](TabShareService.md) on
  `context.db` and `context.browser` (log lines go to `context.logger.info`
  and the console as `[tab-share] ...`), starts it with a
  [TabShareWebRouter](TabShareWebRouter.md)'s router and upgrade handler,
  registers the IPC below and resolves the API
  `{ getStatus(), share(tabId, mode), stop(shareId) }`.
- `deactivate()`: destroys the service. `service()`.

## Entry files

- `manifest.js`: id `tab-share`, requires `core:browser` and
  `core:database`, `private` and `distributable`, `browserScripts:
  ['./web/viewer.js']`, settings page `settings.html`, `renderer.js`.
  The renderer, settings page, `web/` viewer and `rtc/` capturer page stay
  classic files ([renderer](renderer.md), [settings](settings.md),
  [viewer](web/viewer.md), [capturer](rtc/capturer.md)).
- `main.js`: `{ activate, deactivate }` delegating to one instance.

## IPC (renderer contract)

`ext.tab-share.status`, `getForTab(tabId)`, `share(tabId, mode)`,
`setMode(shareId, mode)`, `stop(shareId)`, `stopAll`, `getSettings`,
`updateSettings(patch)` (a non-object patch counts as `{}`). Tab ids are
coerced with `Number`, share ids with `String`. Push:
`ext.tab-share.changed` `{ reason, shareId, status }` to every live window.
