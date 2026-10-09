# ElementInteractionCommands

`extensions/selenium-driver/commands/ElementInteractionCommands.js`

Click, clear and send keys with in-page DOM calls.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `elementClick`: scrolls to centre and calls `el.click()`. A thrown click is
  `element click intercepted` unless the handle has a `description` (from
  `lumabyte/find`), the session enabled fallback and `onClickIntercepted`, and the
  re-resolved selector clicks through `browser.click`.
- `elementClear`: empties `value` and fires input and change.
- `elementSendKeys({ text })`: appends to `value` (or text for non-inputs), focuses,
  fires input and change. Missing text is `invalid argument`.
