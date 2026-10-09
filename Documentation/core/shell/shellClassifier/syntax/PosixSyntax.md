# PosixSyntax

`core/shell/shellClassifier/syntax/PosixSyntax.js`

[ShellSyntax](ShellSyntax.md) for POSIX sh and bash.

## Rules

- Backslash escape; inside double quotes it only escapes `` $ ` " \ `` and newline (POSIX 2.2.3).
- `'...'`, `"..."`, bash `$'...'` ([AnsiCString](AnsiCString.md)), `$(...)`, backquotes, `<(...)` / `>(...)`.
- Control operators `&& || |& | ; & newline ( )`; redirections `&>> &> <<< <<- << <> <& < >> >| >& >`; any digit
  run is an io number.
- Reserved words `if then else elif fi do done while until esac ! { }`; assignments; `&` runs in the background.
- `PosixSyntax.DOUBLE_QUOTE_ESCAPABLE`, `PosixSyntax.RESERVED_WORDS`.

## Why

Sources: POSIX Shell Command Language sections 2.2-2.10 and the bash manual.
