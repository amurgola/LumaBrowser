# BoundedJson

`core/llm-server/chat/outline/BoundedJson.js`

Compact JSON that gives up as soon as the text passes a character cap.

## Methods

- `BoundedJson.stringify(value, maxChars)`: the same text `JSON.stringify(value)`
  writes (toJSON, dropped undefined/function fields, `null` for non-finite
  numbers and holes), or `null` when it would be longer than `maxChars`.

## Why

"Does this fit?" is asked of every value the outline might inline. Building
the text and stopping at the cap makes the answer cost O(cap), and the length
is exact (JSON.stringify does the escaping), so no escape-cost estimates are
needed. A string longer than the cap is rejected without serializing it,
because escaping never shortens text.
