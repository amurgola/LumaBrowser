# PredicateProfile

`core/shell/shellClassifier/rules/readOnly/PredicateProfile.js`

[CommandProfile](CommandProfile.md) decided by one test over the raw (string-normalized) args, with read and
refuse phrases.

## Methods

- `new PredicateProfile(names, test, { reads, refuses })`; the defaults describe version, list and inspect forms.
- `PredicateProfile.never(names, refuses)`, `PredicateProfile.always(names, reads)`.
- `judge(name, args)`.

## Why

Toolchains read in subcommand forms (`npm ls`, `docker ps`), not by option, and a few builtins are simplest as one
test (`stty -a`, `alias`).
