# SelectorReplyParser

`core/browser/llm-fallback/SelectorReplyParser.js`

Turns the selector resolver's reply text into one CSS selector.

## Methods

- `SelectorReplyParser.parse(text)`: strips code fences, then one pair of
  wrapping `"` or `'` quotes, keeps the first line, trims. Returns null for empty
  input or a result longer than 500 characters.
