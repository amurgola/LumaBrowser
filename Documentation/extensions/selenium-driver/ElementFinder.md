# ElementFinder

`extensions/selenium-driver/ElementFinder.js`

Finds elements and registers a handle per match.

## Methods

- `new ElementFinder(pageScript, fallbackService)`.
- `findAll(session, body, scopeSelector = null)` with body `{ using, value, 'lumabyte:description'? }`
  -> element references (possibly none).
  - Missing `using` or non-string `value` -> `invalid argument`.
  - `using: 'ai-description'` needs `session.llmFallback.enabled` (else
    `unsupported operation`) and resolves `value` to CSS through the fallback (no
    selector -> `no such element`).
  - An unparseable locator -> `invalid selector`.
  - Zero matches with a `lumabyte:description`, fallback enabled and `onFindFail`:
    resolves the description (failed selector = the original value) and counts again.
- `count(session, { using, value }, scopeSelector)` -> number of matches, 0 on any probe failure.
