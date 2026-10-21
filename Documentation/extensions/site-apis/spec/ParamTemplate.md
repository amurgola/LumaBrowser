# ParamTemplate

`extensions/site-apis/spec/ParamTemplate.js`

Endpoint parameters: declaration, call-time validation and `{{name}}` rendering inside step fields.

## Methods

- `normalizeParam(param, index)`: `{ name, type: string | number | boolean, required, description, default?, example? }`;
  a param with a default is not required.
- `resolve(params, input)`: `{ ok: true, values }` with every declared param present (defaults filled, types
  coerced, unknown keys dropped) or `{ ok: false, error }`.
- `render(value, values, { encode })`: substitutes placeholders recursively through strings, arrays and objects.
  `{{name|url}}` always URL-encodes, `{{name|raw}}` never does, otherwise `encode` decides (the runner passes
  `true` for a navigate URL). An unknown placeholder is left as written.
- `referenced(value)`: the set of placeholder names a value uses.
- `inputSchema(params)`: the JSON-schema object the MCP and chat tools advertise.
