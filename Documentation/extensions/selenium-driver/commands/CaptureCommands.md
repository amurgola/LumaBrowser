# CaptureCommands

`extensions/selenium-driver/commands/CaptureCommands.js`

Screenshots through [ScreenshotReader](../ScreenshotReader.md).

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `takeScreenshot`.
- `takeElementScreenshot`: checks the element, then returns the viewport (no crop in v1).
- `printPage`: `unsupported operation`.
