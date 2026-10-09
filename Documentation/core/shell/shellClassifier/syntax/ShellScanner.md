# ShellScanner

`core/shell/shellClassifier/syntax/ShellScanner.js`

Reads the self-delimiting constructs inside a word by recursive descent, for one [ShellSyntax](ShellSyntax.md).

## Methods

- `readPiece(cursor)`: the construct at the cursor as `{ text, quoted }` (consumed), or `null` at a plain character.
  Pieces: escape (an escaped line break is a continuation and vanishes), `$'...'`, here-string, single quotes, double
  quotes (with live escapes and nested substitutions), `$(...)`, PowerShell `${...}` variables, `<(...)`/`>(...)`, backquotes. Substitutions are
  returned raw so [CommandSubstitution](../CommandSubstitution.md) can find them later. At most one piece opens at any
  position, so their order carries no meaning.
- `opensPiece(cursor)`.
- `skipBalanced(cursor, closer)`: moves past the matching `closer`, stepping over quotes, escapes, substitutions and
  nested parentheses; false when the text ends first or nesting exceeds `ShellScanner.MAX_NESTING` (128).
- `skipBackquoted(cursor)`: moves past the first unescaped backquote (POSIX 2.6.3).

## Why

Reading each construct whole, rather than toggling mode flags per character, keeps nesting correct by construction,
and sharing it between the lexer and CommandSubstitution makes both agree on where a substitution ends.
