# SyntaxCatalog

`core/shell/shellClassifier/syntax/SyntaxCatalog.js`

Hands out the shared, frozen [ShellSyntax](ShellSyntax.md) for a dialect.

## Methods

- `SyntaxCatalog.forDialect(dialect)`: the name is normalized by [ShellDialect](../ShellDialect.md) (aliases such as
  `pwsh`, `cmd.exe`; unknown names are posix).

## Why

Syntaxes are immutable, so one instance per dialect serves every lexer and parser.
