# ClickUpSocketScript

`core/browser/tab-preload/ClickUpSocketScript.js`

Builds the page script that reports ClickUp's notifications from the app's
websocket. Embedded by [MainWorldScript](MainWorldScript.md) after the
Notification overrides; runs only when `location.hostname` ends in
`clickup.com`. CommonJS.

## Methods

- `ClickUpSocketScript.build()` returns the source of an expression that runs
  at once with the main-world `report(payload)` function in scope. It replaces
  `window.WebSocket` with a subclass that listens for `message` events on
  every socket the page opens (the native constructor, arguments and
  prototype are untouched, so ClickUp's own `onmessage` handlers still run).
  A text frame that parses as `{ msg: 'notification', payload: { notification
  } }` with a title and without `data.hidden` is reported as `{ title, body,
  icon, badge, tag: data.uuid, requireInteraction, silent, data, source,
  url: notification.url || data.url || location.href }`, once per uuid (the
  last 200 keys are remembered).
- `HOST_PATTERN`, `MESSAGE_TYPE` (`'notification'`), `SEEN_LIMIT` (200).

## Why

ClickUp's web client only shows browser notifications through Web Push from
its service worker. Electron's content layer has no push service, so
`pushManager.subscribe` fails with "push service not available" and ClickUp's
notification settings show "Received notification" and "Notification shown"
as failing. The same notifications also reach the page over its main
websocket: the web client tracks them as received and then, outside the
ClickUp desktop app, does nothing with them. Sniffing that stream is the
only page-side source for them.
