# TabNotificationRelay

`core/browser/tab-view/TabNotificationRelay.js`

Forwards a web notification intercepted in a tab's preload (main-world
`Notification` override, sent over `notification-intercepted`) to the chrome and
to in-process listeners.

## Methods

- `new TabNotificationRelay({ registry, channel, emitter })`.
- `relay(senderWebContents, notificationData)`: resolves the tab from the sender
  (dropped when it is not a tab, such as a real popup window), sends
  `notification-intercepted { tabId, notificationData }` to the chrome, and emits
  `notification { tabId, notificationData, tab: { id, partition, title, url, keepAlive, hidden } }`
  on the TabViewManager (NotificationSource triggers). A throwing listener never
  breaks the renderer path.
