# OperatorReader

`core/shell/shellClassifier/syntax/OperatorReader.js`

Matches the longest operator of a [ShellSyntax](ShellSyntax.md) at the cursor.

## Methods

- `read(cursor)`: `{ op, kind: 'control' | 'redirect' }` (consumed) or `null`.
- `opensRedirect(cursor)`, `readRedirect(cursor)`: the same, redirections only (used after an io number).

## Why

POSIX 2.3: an operator extends while the longer text is still an operator, so `&&` beats `&`, `>>` beats `>`, and
`>|` is one operator rather than `>` followed by a pipe.
