# CommandSubstitution

`core/shell/shellClassifier/CommandSubstitution.js`

Finds the command lines inside a word's `$(...)`, `<(...)`, `>(...)` and backquote substitutions, which run before
or beside the outer command.

## Methods

- `CommandSubstitution.extract(value, { dialect })`: the outermost inner lines (the classifier re-parses each and
  finds its own nesting). Blank bodies are dropped.
- `CommandSubstitution.extractAll(values, { dialect })`: `extract` over several words, flattened.
- `CommandSubstitution.locate(value, { dialect })`: every substitution as
  `{ kind, body, closed, span, bodySpan, nested }`, spans being offsets into `value`, for precise error messages.

## Behaviour

- Bodies are skipped with [ShellScanner](syntax/ShellScanner.md), so a `)` inside quotes or a nested group does not
  end them. The dialect (posix by default) picks the quoting rules inside bodies.
- An unclosed `$(` keeps the rest of the word as its body: a body the scanner cannot close may still run, so it is
  judged rather than skipped. An unclosed backquote is a literal character (common in PowerShell text).
- Backquoted bodies have `\$`, `` \` `` and `\\` unescaped (POSIX 2.6.3) before use, so nested backquotes are found.
- Nesting deeper than `ShellScanner.MAX_NESTING` is not descended into.

## Why

A substitution can run anything inside an otherwise harmless command, so each one is classified on its own.
