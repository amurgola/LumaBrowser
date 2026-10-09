# WindowCommands

`extensions/selenium-driver/commands/WindowCommands.js`

Windows are tabs, addressed by `luma-tab-<id>` handles ([WindowHandle](../WindowHandle.md)).

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `getWindowHandle`, `getWindowHandles`.
- `switchToWindow({ handle })`: unknown or missing tab -> `no such window`; resets the frame chain.
- `newWindow({ type })` opens a tab either way and echoes `tab` or `window`.
- `closeWindow` -> remaining handles.
- `getWindowRect`, `setWindowRect`, `maximize`, `minimize`, `fullscreen` ->
  `unsupported operation` `setWindowRect=false`.
- `switchToFrame({ id })`: only null/undefined (top frame); anything else is
  unsupported in v1. `switchToParentFrame` pops the chain.
