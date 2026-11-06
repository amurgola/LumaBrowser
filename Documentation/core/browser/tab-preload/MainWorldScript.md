# MainWorldScript

`core/browser/tab-preload/MainWorldScript.js`

Builds the page script the tab preload runs in the page's MAIN world: the window.chrome and passkey shims, then the Notification and `ServiceWorkerRegistration.prototype.showNotification` overrides that report every notification with `window.postMessage`. CommonJS (preload of an unsandboxed view).

## Methods

- `MainWorldScript.build(chromeShim, passkeyShim)` returns the script source.
  It never throws into the page (errors go to the page console as
  `[luma-inject] main-world patch failed:`), runs once per page
  (`window.__lumaMainWorldPatched`), wraps `window.Notification` in a subclass
  whose constructor reports `{ title, body, icon, badge, tag,
  requireInteraction, silent, data, source: location.hostname, url:
  location.href }` only while the native permission is granted, wraps
  `ServiceWorkerRegistration.prototype.showNotification` (when the page has
  it) to report the same payload (also only when granted) before calling the
  native method, and reports service-worker `{ type: 'notification' }`
  messages the same way.
- Permission state: Electron only knows granted or denied, so a site with no
  answer would read as denied and never ask. `Notification.permission`
  returns `'granted'`, else `'default'` until a `requestPermission()` from
  this document comes back denied (then `'denied'`). `requestPermission`
  goes to the native one (which reaches PermissionManager's prompt) and also
  calls the legacy callback. `navigator.permissions.query({ name:
  'notifications' })` reports `'prompt'` in the same `'default'` case.
- `MainWorldScript.NOTIFY_KEY` = `'__lumaNotificationIntercept'`, the message marker.

## Why the main world

The preload runs with contextIsolation, so assigning `window.Notification` in
the preload's isolated world changes a binding page scripts never see (the
"test webhook works but real sites are never intercepted" bug). Identity
(UA, userAgentData) is not patched here: the identity layer sets it natively.
This is the contract the notification-interceptor relies on: page
notifications reach `notification-intercepted`, then the shell's
`window.handleNotification(data, tabId)`.

## Service-worker notifications

Gmail, Outlook and Teams raise most notifications through
`registration.showNotification(...)` from page scripts; the prototype wrap
catches those. A push handled entirely inside the worker (no page involved)
never passes through the page and is still missed.

## ClickUp

ClickUp only shows notifications through Web Push, which Electron cannot
subscribe to at all, so neither override ever sees them. After the overrides
the script embeds [ClickUpSocketScript](ClickUpSocketScript.md), which on
clickup.com reports the same notifications from the app's websocket.
