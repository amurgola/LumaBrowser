# SessionSetup

`app/ready/SessionSetup.js`

Session-wide browser policy once the app is ready.

## Methods

- `new SessionSetup(ctx, { log? })`.
- `applyPolicies()`: [ChromeIdentity](../../core/browser/ChromeIdentity.md)`.applyToSession`
  on the default session; the DNS provider from `core.network.dnsProvider`
  ([DnsResolver](../../core/shell/DnsResolver.md)`.applyProvider`, never for
  `default`); one [PermissionManager](../../core/browser/PermissionManager.md)
  (installed as the shared instance) on the default session and `persist:main`,
  resolving tabs (and the window each is drawn in) through the TabViewManager.
- `hookSessions()`: every later `session-created` gets the enabled Chrome
  extensions and adblock rules (once those services are `ready`) and the
  [InternalBearerInjector](InternalBearerInjector.md); the default session and
  `persist:main`, which already exist, get the injector directly.

## Why

Permissions deny by default and prompt for camera and microphone, remembering
per-site answers. Sec-Fetch-* headers are deliberately not forced: Chromium's
own per-request values are right, and pinning them made subresources look
impossible for a real browser.

## Extension worker preload

`hookSessions()` also attaches the chrome extension
[ShimBridge](../../core/chrome-extensions/bridge/ShimBridge.md) to the default
and `persist:main` sessions, and `_onSessionCreated` attaches it to every later
session before extensions load into it. The preload has to be registered well
ahead of the first `loadExtension`: registered just before it, the worker that
load starts misses it.
