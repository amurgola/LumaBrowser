# ShellSyntax

`core/shell/shellClassifier/syntax/ShellSyntax.js`

Base class describing one shell's lexical rules as data. Subclasses: [PosixSyntax](PosixSyntax.md),
[PowerShellSyntax](PowerShellSyntax.md), [CmdSyntax](CmdSyntax.md); get instances from
[SyntaxCatalog](SyntaxCatalog.md).

## Fields

`dialect`, `escapeChar`, `singleQuotes`, `doubleQuotes` (strings of quote characters), `doubledQuotes`, `ansiCQuotes`,
`hereStrings`, `dollarParen`, `bracedVariables`, `processSubstitution`, `backquoteSubstitution`, `callOperator`, `assignments`,
`backgroundOperator`, `controlOperators`, `redirectOperators`, `reservedWords`, `ioNumber` (regex), and `operators`
(all operators tagged `control` / `redirect`, longest first). Unset fields take `ShellSyntax.DEFAULTS`.

## Methods

- `isBlank(ch)`, `endsWord(ch)` (blank, newline or an operator's first character), `isSingleQuote(ch)`,
  `isDoubleQuote(ch)`, `isReservedWord(word)`.
- `escapesInDoubleQuotes(next)`: false here; subclasses override.
- `defaultFd(op)`: 0 for `<` forms (including `<>`), 1 for `>` forms, `'all'` for `&>`.

## Why

Keeping dialects as data lets one lexer serve all three without branching on the dialect name.
