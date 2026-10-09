# AssignmentWord

`core/shell/shellClassifier/syntax/AssignmentWord.js`

Recognizes a posix variable assignment word.

## Methods

- `AssignmentWord.parse(word)`: `{ name, value }` when the word's raw source starts with an unquoted name (portable
  letters, digits, underscore, not starting with a digit) and `=` or bash's `+=`; `value` is after quote removal.
  Otherwise `null`.

## Why

POSIX 2.10.2 rule 7 recognizes assignments before quote removal, so `"A"=1` is a command word and `A="b c"` an
assignment.
