# ElementWaiter

`core/browser/tab-manager/ElementWaiter.js`

wait_for: polls until a selector appears (or disappears).

## Methods

- `ElementWaiter.waitFor(page, { selector, text, state = 'visible', timeout = 5000 })` -> `{ success, data: { found, tagName?, text? } }`
  or `Timeout after <timeout>ms waiting for <selector>`. Polls every 200 ms; `state: 'hidden'` waits for absence.
- `ElementWaiter.script(selector, text, state)`.
