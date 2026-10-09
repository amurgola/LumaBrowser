# StringStats

`core/llm-server/chat/outline/stats/StringStats.js`

Strings at one path. Extends [ValueStats](ValueStats.md).

## describe() and detail()

- a constant: `string "x" (always)`;
- categories (at most 5 distinct, repeated, none over `CATEGORY_MAX_CHARS` = 24):
  `string, one of "open", "closed"`;
- otherwise: `string 5..7 chars, 50 distinct`, with detail `, e.g. "Row 0"`.

## Why

Status-like fields are what a model filters on; listing their values saves a
follow-up read. Strings longer than 24 characters are content, not categories.
