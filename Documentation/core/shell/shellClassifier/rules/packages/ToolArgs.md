# ToolArgs

`core/shell/shellClassifier/rules/packages/ToolArgs.js`

A read-only view over one tool's arguments, parsed once so the [VerbTable](VerbTable.md) rows ask plain questions.

## Methods

- `new ToolArgs(args)`; `raw` (strings) and `text` (joined with spaces, for query scanning).
- `words` -> lowercased positional words; `spelledWords` -> the same words as typed (for the card).
- `hasOption(...names)` -> names without dashes, case-insensitive; `-auto-approve` and `--auto-approve` both count.
- `hasShortFlag(letter)` -> a POSIX bundled short flag (`-fv` has `f`); case-sensitive.
- `valuesOf(...names)` -> inline (`--x=v`, `-X:v`) or following-word values.
- `inlineValuesOf(...names)` -> inline values only, lowercased.
- `pathStarts()` -> indexes where a subcommand path may begin: the first word, and later words while every earlier
  word directly follows an option (so it may be that option's value).

## Why

Tools put global options before the subcommand (`kubectl -n prod delete`); `pathStarts` lets those through without a
per-tool list of value-taking options. Arguments after `--` are always words. A word that follows a boolean flag is
still offered as a value, which only matters for option-driven rows and errs toward asking.
