# ScannedArgs

`core/shell/shellClassifier/rules/readOnly/ScannedArgs.js`

Result of [OptionGrammar](OptionGrammar.md)`.scan`: `options` (each `{ form, name, value, spelling }`, form one of
`short`, `long`, `word`, `param`) and `operands`.

## Methods

- `addOption(form, name, value, spelling)`, `addOperand(word)`: used by the grammar.
- `valuesOf(short, long)`: every value given to the short letter or long name, in order (all `-e` scripts).
- `hasOption(short, long)`.

## Why

Profiles and inspectors ask questions of parsed options instead of re-parsing raw words.
