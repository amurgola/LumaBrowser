# NotificationInterceptorRenderer

`extensions/notification-interceptor/ui/NotificationInterceptorRenderer.js`

The Notifications extension in the main window: the
[NotificationSettingsTab](NotificationSettingsTab.md) plus the
[NotificationCapture](NotificationCapture.md) hook the shell calls for each
intercepted web notification. Interception itself happens in the tab preload
(see the capture contract in [NotificationInterceptorExtension](../NotificationInterceptorExtension.md)).

## Methods

- `activate(context)`: deactivates a previous activation, activates the
  settings tab (which loads settings and log), then installs the capture hook
  with `context.browserRenderer`.
- `deactivate()`: uninstalls the hook, then tears the tab down.

## Globals

None directly (see the two classes). The entry `renderer.js` writes
`window.__ext_notification_interceptor` (`{ activate, deactivate }`), the
shell's extension renderer contract.
