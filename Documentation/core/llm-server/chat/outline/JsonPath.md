# JsonPath

`core/llm-server/chat/outline/JsonPath.js`

Builds the JSONPath labels of outline lines.

## Methods

- `JsonPath.child(path, key)`: `$.rows` for identifier-like keys,
  `$["odd key"]` otherwise.
- `JsonPath.everyElement(path)`: `$.rows[*]`.
- `JsonPath.ROOT` (`$`).

## Why

JSONPath is widely known to models and maps directly to grep targets and
jq-style requests, so each line doubles as an address for a follow-up read.
