# RangeTracker

`core/llm-server/chat/outline/stats/RangeTracker.js`

Smallest and largest of a stream of numbers.

## Methods

- `observe(n)`, `min`, `max`, `isEmpty`.
- `phrase()`: `lo..hi`, one number when equal, `?` when empty.
- `RangeTracker.format(n)`: integers as is, fractions to six significant digits.

Used for numeric values, string lengths and array lengths.
