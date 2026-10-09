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
  resolving tabs through the TabViewManager.
- `hookSessions()`: every later `session-created` gets the enabled Chrome
  extensions and adblock rules (once those services are `ready`) and the
  [InternalBearerInjector](InternalBearerInjector.md); the default session and
  `persist:main`, which already exist, get the injector directly.

## Why

Permissions deny by default and prompt for camera and microphone, remembering
per-site answers. Sec-Fetch-* headers are deliberately not forced: Chromium's
own per-request values are right, and pinning them made subresources look
impossible for a real browser.
