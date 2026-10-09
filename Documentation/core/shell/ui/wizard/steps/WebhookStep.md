# WebhookStep

`core/shell/ui/wizard/steps/WebhookStep.js` (ES module)

The Webhook step: where intercepted notifications are POSTed, with a test send.

## Methods

- `enter()`: reads the saved URL once (only when notification-interceptor is
  among the choices) unless one was typed. `render()`; Send test notification
  prefers `electronAPI.testWebhookDirect` (the extension handler only exists
  after Finish) over `testWebhook`.

## Globals

Reads `window.electronAPI` (getWebhookUrl, testWebhookDirect, testWebhook).
