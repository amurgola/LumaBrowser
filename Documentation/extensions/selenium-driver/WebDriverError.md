# WebDriverError

`extensions/selenium-driver/WebDriverError.js`

The W3C error vocabulary (spec 6.6).

## Methods

- `WebDriverError.TABLE`: name -> `{ status, code }` (for example `noSuchElement` 404
  `no such element`, `invalidArgument` 400, `unknownMethod` 405, `javascriptError` 500).
- One factory per name: `WebDriverError.noSuchElement(message, data)`; the message
  defaults to the code.
- `new WebDriverError(name, message, data)`: `name: 'WebDriverError'`, `wdName`,
  `wdCode`, `httpStatus`, `data`. An unknown name is `unknown error`.
- `WebDriverError.serialize(err)` -> `{ status, body: { value: { error, message, stacktrace, data? } } }`;
  anything else becomes a 500 `unknown error`.
