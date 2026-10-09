# FindCommands

`extensions/selenium-driver/commands/FindCommands.js`

Element finding through [ElementFinder](../ElementFinder.md).

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `findElement` (none -> `no such element`), `findElements`.
- `findElementFromElement`, `findElementsFromElement`: check the parent exists, then
  search the whole document (subtree scoping is v1-missing, as legacy).
- `getActiveElement`: tags `document.activeElement` with a one-off `data-lb-active`
  attribute and returns a handle to it.
- `getElementShadowRoot`: a shadow reference, or `no such shadow root`.
- `findElementFromShadow`, `findElementsFromShadow`: `unsupported operation`.
