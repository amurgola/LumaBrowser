# SessionCommands

`extensions/selenium-driver/commands/SessionCommands.js`

Session lifecycle, `/status` and timeouts.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `newSession`: merges capabilities ([SessionCapabilities](../SessionCapabilities.md)),
  takes the fallback config from `lumabyte:llmFallback` ([FallbackConfig](../FallbackConfig.md)),
  binds the first listed tab (creating `about:blank` when there is none; failures are
  `session not created`) -> `{ sessionId, capabilities }`.
- `deleteSession` -> null.
- `status` -> `{ ready: true, message: 'LumaBrowser WebDriver ready', build: { version: '1.0.0' }, os, sessions }`.
- `getTimeouts`; `setTimeouts` (script may be null; non-numbers ignored).
