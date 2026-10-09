# NavigationCommands

`extensions/selenium-driver/commands/NavigationCommands.js`

Navigation on the session's current tab.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `navigateTo` (`url` required, else `invalid argument`), `getCurrentUrl`, `goBack`
  and `goForward` (`history.back/forward()` in page), `refresh`, `getTitle`.
