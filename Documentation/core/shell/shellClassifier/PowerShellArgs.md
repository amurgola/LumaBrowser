# PowerShellArgs

`core/shell/shellClassifier/PowerShellArgs.js`

Reads PowerShell-style parameters out of a parsed argument list.

## Methods

- `PowerShellArgs.param(args, names)` returns the inline value (`-Path:x`), the following non-flag word, `true` for a
  bare switch, or `null` when absent. Names match case-insensitively, and a key of 3+ letters matches as a prefix
  (`-Rec` is `-Recurse`), as PowerShell does.
- `PowerShellArgs.switchOn(args, name)` is true unless absent or explicitly `$false`, `false` or `0`.
- `PowerShellArgs.positionals(args)` returns words that are neither parameters nor the value of a value-taking
  parameter (`VALUE_PARAMS`: path, literalpath, destination, filepath, ... ).
- `PowerShellArgs.splitList(value)` splits a `a,b,c` array literal.

## Notes

Prefix matching is deliberately loose, matching legacy: `-Destination` also matches `DestinationPath`, so a write
target can be listed twice (harmless for the containment check). A switch followed by a plain word returns that word,
which still counts as on.
