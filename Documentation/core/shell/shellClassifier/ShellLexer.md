# ShellLexer

`core/shell/shellClassifier/ShellLexer.js`

Splits one command line into word, control-operator and redirection tokens, each with its source span, per dialect.

## Methods

- `ShellLexer.tokenize(source, { dialect })` returns [ShellToken](syntax/ShellToken.md)s. `null` is empty; the dialect
  is resolved by [SyntaxCatalog](syntax/SyntaxCatalog.md). Never throws.

## Design

A loop over one [SourceCursor](syntax/SourceCursor.md): skip blanks, then read either an operator
([OperatorReader](syntax/OperatorReader.md), longest match) or a word ([WordReader](syntax/WordReader.md), which glues
plain text to the self-delimiting pieces of [ShellScanner](syntax/ShellScanner.md)). Quotes and substitutions are read
whole by recursive descent, so there is no per-character mode flag. All dialect differences are data in a
[ShellSyntax](syntax/ShellSyntax.md). Only three rules need context and live here:

- **Numbered redirections** (POSIX 2.10.1 io_number): an unquoted all-digit word (PowerShell 1-6 or `*`, cmd one
  digit) touching `<` or `>` becomes the fd of that redirection: `2>>` stays `2>>` with `fd: 2`.
- **Reserved words** (POSIX 2.4), posix only: unquoted `if then else elif fi do done while until esac ! { }` at a
  command start become control tokens, so `if rm -rf /; then` exposes `rm`. Elsewhere (`echo {a,b}`, `find -exec rm {}`)
  they are words.
- **Call operator** (about_Operators): PowerShell `&` at a command start emits nothing; the next word is the command.

## Deliberate choices

- `#` comments are not recognized: text after `#` is still lexed, so nothing can hide behind one.
- Posix here-document bodies are not consumed: their lines are lexed as commands, which over-reports but never hides a
  body fed to `sh <<EOF` or one containing `$(...)`. The `<<` delimiter is an input redirection.
- cmd `;` is a separator (it is only a delimiter in cmd): over-splitting is the safe error.
- Unterminated quotes, substitutions and very deep nesting run to the end of the input.

## Why

The classifier is only as good as its view of the line: an under-parse lets a dangerous command through. The rules
follow the POSIX Shell Command Language (2.2 quoting, 2.3 token recognition, 2.6.3 command substitution, 2.7
redirection), bash (`$'...'`, `<(...)`, `|&`, `&>`), PowerShell about_Parsing / about_Quoting_Rules / the language
specification (backtick, doubled and typographic quotes, here-strings), and cmd.exe (caret escape, no single quotes).

Replaces the former `ShellTokenizer`.
