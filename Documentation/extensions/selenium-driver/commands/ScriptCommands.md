# ScriptCommands

`extensions/selenium-driver/commands/ScriptCommands.js`

Page source and script execution.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `getPageSource`: `browser.getSource(tabId, { type: 'full' })`.
- `executeScript({ script, args })`: runs the body with `arguments`; element
  references in args become live lookups (unknown ones become null). A throw is
  `javascript error`.
- `executeAsyncScript`: `unsupported operation` in v1.
