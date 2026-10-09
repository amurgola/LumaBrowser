# ShellWords

`core/shell/shellClassifier/ShellWords.js`

Small word helpers shared by the classifier rules.

## Methods

- `ShellWords.lower(value)` lowercases, treating `null`/`undefined` as `''`.
- `ShellWords.lowerAll(args)`.
- `ShellWords.hasShortFlag(args, letter)` is true when a bundled short flag (`-rf`, letters only) carries the letter.
- `ShellWords.nonFlags(args)` drops words starting with `-`.
- `ShellWords.splitWords(text)` splits on whitespace; only for wrapper strings the full parser re-reads later.
