# NumberStats

`core/llm-server/chat/outline/stats/NumberStats.js`

Numbers at one path. Extends [ValueStats](ValueStats.md).

## describe()

- a constant: `integer 200 (always)`;
- few repeated values: `integer, one of 200, 404`;
- otherwise: `integer 0..299, 50 distinct` (`number` when any is fractional).
