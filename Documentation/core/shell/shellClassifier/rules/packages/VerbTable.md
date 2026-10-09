# VerbTable

`core/shell/shellClassifier/rules/packages/VerbTable.js`

The declarative "tool + words (+ options) -> effect" table every [ToolFamily](ToolFamily.md) is written in, and the
only place matching happens.

## Rows

`new VerbTable([{ tools: [...], rows: [...] }])`. A row has `effect`, optional `scope`, `preview` and
`when(toolArgs)`, plus one of:

- `path: 'system prune'` - leading subcommand words; `a|b` alternatives, `*` any word; or an array mixing such strings
  and word predicates (`['*', isDeleteOperation]`);
- `anyWord: (word) => bool` - a word anywhere among the positionals (build goals, cloud verbs);
- neither - the tool name alone decides (`dropdb`).

Sections naming the same tool append their rows in order.

## Methods

- `match(tool, toolArgs, shownAs = tool)` -> `{ effect, subject, scope, preview }` from the first matching row, or
  `null`. `subject` is `shownAs` plus the matched words as typed.
- `has(tool)`, `tools`, `effects` (each effect once, for checking against [RiskEffect](RiskEffect.md)).
- `VerbTable.oneOf(...words)` -> a word predicate.

## Why

Keeping knowledge as data makes each family a readable list, keeps first-match-wins ordering explicit (narrow rows
first), and means a new tool is a row, not a branch. Tools are held in a `Map`, so names like `constructor` never match.
