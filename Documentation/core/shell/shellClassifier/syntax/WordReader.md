# WordReader

`core/shell/shellClassifier/syntax/WordReader.js`

Reads one word token.

## Methods

- `new WordReader(syntax, scanner)`; `read(cursor)`: glues plain characters and [ShellScanner](ShellScanner.md)
  pieces until an unquoted blank or operator character. Returns a [ShellToken](ShellToken.md) word, or `null` when
  nothing word-like was read (a lone line continuation). A piece wins over a word ender, so `<(ls)` is a word.

## Why

POSIX 2.3: a word is a run of characters and quoted parts with no unquoted delimiter between them.
