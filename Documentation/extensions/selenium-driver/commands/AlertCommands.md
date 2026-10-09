# AlertCommands

`extensions/selenium-driver/commands/AlertCommands.js`

User prompts through `browser.handleDialog`; no pending dialog is `no such alert`.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `dismissAlert`, `acceptAlert`, `sendAlertText({ text })` (accepts with text).
- `getAlertText`: `unsupported operation` in v1.
