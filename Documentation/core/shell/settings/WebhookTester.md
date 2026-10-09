# WebhookTester

`core/shell/settings/WebhookTester.js`

Sends the first-run wizard's "Send test notification" webhook.

## Methods

- `new WebhookTester({ post?, now? })`; `post` defaults to `axios.post`, loaded on first use.
- `async test(url)` refuses anything not starting with `http://` or `https://`
  (`Enter an http(s) webhook URL.`); posts `{ timestamp, test: true, message:
  'Test notification from LumaBrowser' }` as JSON with a 5 s timeout and returns
  `{ success: true, status, response }`, or `{ success: false, error }`.

## Why

The notification-interceptor's own test handler exists only once that
extension activates, after the wizard finishes, so core registers this one at
boot. The payload mirrors the extension's test.
