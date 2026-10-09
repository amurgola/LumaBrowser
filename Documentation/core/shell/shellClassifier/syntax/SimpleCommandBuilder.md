# SimpleCommandBuilder

`core/shell/shellClassifier/syntax/SimpleCommandBuilder.js`

Builds one simple command from the word and redirection tokens between two control operators.

## Methods

- `new SimpleCommandBuilder(syntax)`; `build(tokens, joinedBy)` returns
  `{ assignments, name, args, redirects, inputs, joinedBy, background: false, span }` (fields described in
  [ShellParser](../ShellParser.md)).

## Behaviour

- Leading [AssignmentWord](AssignmentWord.md)s (when the syntax has assignments) come before the name.
- A redirection takes the next word as its target and is filed by [RedirectRole](RedirectRole.md): outputs in
  `redirects`, inputs in `inputs`, duplications dropped. One with no word after it is dropped.

## Why

Input targets are reads, so they stay out of `args` and out of `redirects` (which the classifier treats as writes).
