# ElementScripts

`extensions/selenium-driver/ElementScripts.js`

The in-page scripts behind element handles.

## Methods

- `ElementScripts.finder({ using, value, scopeSelector })`: counts matches for
  `css selector`, `tag name`, `link text` (trimmed text equals), `partial link text`
  (contains), `xpath`. In-page result `{ ok: true, count }` or `{ ok: false, reason }`
  with reason `scope-missing`, `unsupported-strategy` or `invalid-selector` (plus `message`).
- `ElementScripts.encode(using, value, scopeSelector, index)`: the JSON locator a
  handle stores.
- `ElementScripts.query(encoded)`: an expression evaluating to the Nth match, or null.
- `ElementScripts.onElement(encoded, body)`: an IIFE where `body` sees the element as `el`.
