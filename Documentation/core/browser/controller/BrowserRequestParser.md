# BrowserRequestParser

`core/browser/controller/BrowserRequestParser.js`

Reads `/api/browser` request shapes into tab manager arguments.

## Methods

- `BrowserRequestParser.tabId(value)`: `parseInt(value)`, or `null` when not a number. Also used by
  [BrowserMcpTools](../BrowserMcpTools.md) for `args.tabId`.
- `BrowserRequestParser.updateAction(body)`: PATCH `/tabs/:id` accepts `action` or `type`, `url` or
  `payload`, and `script`. A URL (or `navigate`) wins, then `refresh`, `activate`/`focus`, then
  `executeJs` (or a bare `script`). Returns `{ action: { type, payload? } }` or `{ error, message }`
  (`URL is required for navigation`, `Script is required for JavaScript execution`, `Invalid action`).
- `screenshotOptions(query)`: `fullPage`, `cssScale`, `marks` set only when the query says `'true'`.
- `consoleOptions(query)`: `{ level }` when given.
- `tableOptions(query)`: `selector`, `rowSelector`, `cellSelector` when given.
