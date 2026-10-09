# TextPager

`core/llm-server/chat/web-tools/TextPager.js`

Splits a page's text into numbered parts of bounded size.

## Methods

- `new TextPager(text, partChars)`.
- `count()`: number of parts (an empty text is one empty part).
- `totalChars()`.
- `part(n)`: `{ number, count, start, end, totalChars, text }` for a 1-based
  whole `n`, else `null`. `text` is trimmed; `start`/`end` are raw offsets.
- `partAt(offset)`: the part holding a character offset (the last part past the end).

## Why

Replaces hard truncation: nothing past a cut-off is lost, the model can read on.
A part ends at the last paragraph break, else line break, else space within the
final `BREAK_LOOKBACK_SHARE` (25%) of its size, else at the limit, so parts
rarely split a sentence while never shrinking below three quarters of the
budget. Parts are a pure function of the text, so with the
[PageCache](PageCache.md) part N means the same thing on every call.
