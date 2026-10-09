# AnsiCString

`core/shell/shellClassifier/syntax/AnsiCString.js`

Reads a bash `$'...'` string and decodes its escapes.

## Methods

- `AnsiCString.opensAt(cursor)`: true at `$'`.
- `AnsiCString.read(cursor)`: consumes the string (to the end when unterminated) and returns the decoded text:
  `\a \b \e \E \f \n \r \t \v \\ \' \" \?`, `\xHH`, `\uHHHH`, `\UHHHHHHHH`, octal `\nnn`, `\cX`. An escape with no
  valid digits stays literal, as in bash.

## Why

`rm -rf $'\x2f'` deletes `/`; and `$'\''` is a quote character, not the start of a quoted span, so reading it as a
plain `'...'` string would hide the commands after it.
