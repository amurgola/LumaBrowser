# LargeStringShrinker

`core/llm-server/agent/LargeStringShrinker.js`

Shrinks an over-budget tool result by cutting its largest string values first.

## Methods

- `LargeStringShrinker.shrink(result, excessChars)` returns a deep copy. Strings
  of at least 2048 chars are cut largest first, each keeping
  `max(1024, length - remaining - 300)` chars of its head plus the
  `TRUNCATED: showing first N of M chars` notice, until `excessChars` raw chars
  are gone. The original object (kept in the run trace) is untouched.

## Why

The model keeps valid JSON with an in-band notice telling it the data is
incomplete and which narrower tool to use, instead of a payload cut mid-string.
