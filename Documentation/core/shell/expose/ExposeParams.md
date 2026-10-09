# ExposeParams

`core/shell/expose/ExposeParams.js`

Converts `context.expose()` parameter declarations into an MCP input schema, and
coerces and validates incoming REST arguments against them.

## Methods

- `ExposeParams.toInputSchema(params)` returns `{ type: 'object', properties, required }`.
  Each property gets `type` (default `string`) plus `description`, `items`,
  `properties`, `enum` when truthy and `default` when defined.
- `ExposeParams.coerce(args, params)` converts string values in place by declared
  type and returns `args`: `number` via `Number()`, `boolean` true only for
  `'true'` or `'1'`, `array` and `object` via `JSON.parse` (left as the string
  if invalid). Non-string values are untouched.
- `ExposeParams.missingRequired(args, params)` lists required names whose value
  is `undefined`, `null` or `''`.

## Why

GET requests send every argument as a string, so declared types are restored
before the function sees them. `0` and `false` are real values and never count
as missing.
