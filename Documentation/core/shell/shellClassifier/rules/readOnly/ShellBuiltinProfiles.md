# ShellBuiltinProfiles

`core/shell/shellClassifier/rules/readOnly/ShellBuiltinProfiles.js`

[ProfileGroup](ProfileGroup.md) for POSIX and bash builtins.

- `cd`, `jobs`, `times`, `wait`, `read`: always read (they only touch session state).
- `alias`: refuses `name=value`. `declare`, `typeset`, `export`, `umask`: refuse any operand.
- `set`: reads only `-x`/`+x` toggle bundles (a bundle ending in `o` takes the option name, `set -euo pipefail`);
  operands or `--` replace the positional parameters.
- `history`: `-a`, `-c`, `-d`, `-w` clear, delete or write history.
- `ulimit`: a numeric or `unlimited` value sets a limit.
- `local`, `unset`: never read.

## Methods

- `profiles()`; `_onlyTogglesOptions(args)` backs `set`.

## Why

Listing forms are reads; defining, removing or persisting forms are not.
