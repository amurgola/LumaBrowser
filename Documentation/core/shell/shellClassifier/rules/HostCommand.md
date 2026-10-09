# HostCommand

`core/shell/shellClassifier/rules/HostCommand.js`

A frozen view of one simple command shared by SystemRule, FilesystemRule and their profiles.

## Methods

- `new HostCommand({ name, args, dialect })`: `display` (name as typed), `name` (bare lowercase program, via
  [ShellCommandName](../ShellCommandName.md)), `args` (original case), `lowered`, `positionals` (lowercased
  non-flags), `dialect`. Junk input yields empty values; never throws.
- `has(...words)`, `hasPrefix(...prefixes)`: compare lowercased arguments.
- `hasShortFlag(letter)`: POSIX bundled short flag, original case.
- `valueAfter(...flags)`: the lowercased word after a flag, or `null`.
- `positionalsSkipping(valueFlags)`: positionals past value-taking options, which are matched in original case
  (`systemctl -H host` vs `-h`).

## Why

Every capability and file operation needs the same few lookups; computing them once keeps each profile to its
own decision.
