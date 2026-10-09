# ActionCommands

`extensions/selenium-driver/commands/ActionCommands.js`

Perform Actions, approximated without CDP input.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `performActions({ actions })`: runs tick by tick across sources. `pause` waits for
  nothing; a pointer move with an element origin scrolls it into view (unknown
  element -> stale); a wheel `scroll` calls `window.scrollBy` with integer deltas; key
  and pointer up/down are acknowledged without dispatch.
- `releaseActions` -> null.
