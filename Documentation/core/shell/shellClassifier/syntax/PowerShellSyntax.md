# PowerShellSyntax

`core/shell/shellClassifier/syntax/PowerShellSyntax.js`

[ShellSyntax](ShellSyntax.md) for Windows PowerShell and pwsh.

## Rules

- Backtick escape, live everywhere except single quotes; backslash is a path character.
- Single quotes also include U+2018-U+201B and double quotes U+201C-U+201E; a doubled quote inside a string is a
  literal quote; `@'...'@` / `@"..."@` here-strings.
- `$(...)` subexpressions and `${...}` braced variables (one word, so `${env:ProgramFiles(x86)}` is a single path); no backquote or process substitution, no assignment words.
- Control operators `&& || | ; & newline ( ) { }` (script blocks split so `% { rm $_ }` is judged); `&` at a command
  start is the call operator; redirections `>> >& > <` with stream numbers 1-6 or `*`.
- `PowerShellSyntax.SINGLE_QUOTES`, `PowerShellSyntax.DOUBLE_QUOTES`.

## Why

Sources: about_Parsing, about_Quoting_Rules, about_Redirection, about_Operators and the PowerShell language
specification. Typographic quotes matter: in `'abc<U+2019>; Remove-Item ...` PowerShell closes the string at U+2019.
