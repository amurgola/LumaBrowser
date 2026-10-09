# ValueKind

`core/llm-server/chat/outline/ValueKind.js`

Names the JSON kind of a value.

## Methods

- `ValueKind.of(value)`: `object`, `array`, `string`, `number`, `boolean`,
  `null` (also for NaN and Infinity, which serialize as null), or `absent` for
  undefined, functions and symbols.
- `ValueKind.normalize(value)`: applies `toJSON` (Dates become strings).
- `ValueKind.isPresent(value)`: whether JSON would keep it.
- `ValueKind.ORDER`: the order kinds are listed in on one line.

## Why

Profiling, inlining and serializing must agree on what JSON keeps; one class
decides it.
