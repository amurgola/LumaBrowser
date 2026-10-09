# NotificationForwarder

`core/browser/tab-preload/NotificationForwarder.js`

The isolated-world half of notification interception: hears the main-world script's postMessage reports and sends each payload to the main process. CommonJS.

## Methods

- `new NotificationForwarder(ipcRenderer, window).listen()`: on every `message`
  event with `data[NOTIFY_KEY] === true` and an object `payload`, logs it and
  sends `ipcRenderer.send('notification-intercepted', payload)`.
- `NotificationForwarder.payloadOf(event)`: the payload or null.
- `NotificationForwarder.CHANNEL` = `'notification-intercepted'`, handled by
  [TabViewIpcController](../tab-view/TabViewIpcController.md).
