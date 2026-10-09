# ShellToken

`core/shell/shellClassifier/syntax/ShellToken.js`

Builds the lexer's token shapes.

## Methods

- `ShellToken.word(text, raw, quoted, start, end)` -> `{ kind: 'word', text, raw, quoted, span }`: `text` after quote
  removal, `raw` as written, `quoted` when any quoting contributed (so `''` is still a word).
- `ShellToken.control(op, start, end)` -> `{ kind: 'control', op, span }`: separators, grouping, reserved words.
- `ShellToken.redirect(op, fd, start, end)` -> `{ kind: 'redirect', op, fd, span }`: `op` includes any fd prefix.
- `ShellToken.is(token, kind)`; constants `WORD`, `CONTROL`, `REDIRECT`.

## Why

Spans let later stages point at the exact source text; `raw` lets the parser apply rules that depend on quoting.
