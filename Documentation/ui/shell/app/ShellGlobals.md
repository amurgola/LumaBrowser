# ShellGlobals

`ui/shell/app/ShellGlobals.js`

Publishes the window globals other surfaces read by name (extension renderers, the slot manager, notification-interceptor, the e2e harness, scripts). They were implicit globals of the classic renderer.js and stay a contract; nothing new is added.

## Methods

- `ShellGlobals.publish(app)` writes the globals below.

## Globals

Writes `window.createNewTab`, `closeTab`, `addLogEntry`, `hideNotificationLog`, `updateWebhookStatus`, `handleNotification`, `registerTabMenuContributor`, `openSettings`, `closeSettings`, `gsMarkSaved`, `settingsToast`, `__rerunSetupWizard`, `__loadExtensionRenderers`, `browserRenderer`, `uiSlotManager`.
