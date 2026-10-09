# FunctionSchema

`core/llm-server/chat/tool-schemas/FunctionSchema.js`

Builds one OpenAI tool entry.

## Methods (all static)

- `build(name, description, properties, required)`:
  `{ type: 'function', function: { name, description, parameters: { type: 'object', properties, required? } } }`.
  Properties are deep-copied (`structuredClone`); `required` is only set when
  non-empty.
- `nameOf(schema)`: the function name, or `null`.
