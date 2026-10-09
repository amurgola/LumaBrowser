# UserArgs

`core/llm-server/server/UserArgs.js`

Splits the user's "Extra llama.cpp flags" free text into llama-server argv tokens.

## Methods

- `UserArgs.splitShellArgs(text)` returns the argv tokens for free text. Whitespace
  separates tokens; a single- or double-quoted span is one token with the quotes
  stripped; `""` is an empty token; an unterminated quote runs to the end of the
  text. Non-string input returns `[]`.
- `UserArgs.normalize(input)` accepts the stored free-text string or an
  already-split array and returns a clean argv array. Arrays are filtered to
  non-empty strings; anything else goes through `splitShellArgs`.

## Why the rules are this small

Backslashes are ordinary characters. Windows paths are the common case here and
an escape rule would eat them. Nothing validates flag names: the whole point of
the box is passing a flag the app has not heard of yet.

The launch planner appends these tokens after every flag it derived itself, so a
user flag that repeats a planner flag wins through llama-server's own
last-occurrence-wins parsing.
