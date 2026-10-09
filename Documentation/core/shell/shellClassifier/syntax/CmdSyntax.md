# CmdSyntax

`core/shell/shellClassifier/syntax/CmdSyntax.js`

[ShellSyntax](ShellSyntax.md) for cmd.exe.

## Rules

- `^` escape outside double quotes only; `"..."` is the only quote, so `'a & b'` is two words around a separator.
- No substitutions; parentheses and braces are text.
- Control operators `&& || | & ; newline` (`&` is sequential, never background; `;` is over-split on purpose);
  redirections `>> >& <& > <` with single-digit handles.

## Why

Models write cmd syntax on Windows; treating `'` as a quote would hide `& rd /s /q C:\` inside a "string".
