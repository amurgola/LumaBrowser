# ElementStateCommands

`extensions/selenium-driver/commands/ElementStateCommands.js`

Read-only element commands through [ElementEvaluator](../ElementEvaluator.md).

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `elementText` (innerText, else textContent), `elementTagName` (lower case),
  `elementRect` (`{ x, y, width, height }`): a vanished element is stale.
- `elementAttribute` (null when absent), `elementProperty`, `elementCss` (computed value).
- `elementEnabled` (`!disabled`), `elementSelected` (checked for checkbox/radio,
  selected for option, else false).
- `elementComputedRole`: the `role` attribute only. `elementComputedLabel`:
  aria-label, first label, alt, then title.
