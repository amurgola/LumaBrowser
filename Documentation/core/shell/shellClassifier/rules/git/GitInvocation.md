# GitInvocation

`core/shell/shellClassifier/rules/git/GitInvocation.js`

Splits a git command line into globals, injected config and the subcommand.

## Methods

- `GitInvocation.parse(name, args)` -> `{ globals, overrides, execPath, unknownGlobals, subcommand, rest }`, or `null`
  when the program is not `git` / `git-<sub>`. Globals stop at the first non-option word.
- `GitInvocation.isInfoOnly(invocation)`: only print-and-exit globals (`--version`, `-h`, bare `--exec-path`, ...).

`GLOBAL_OPTIONS` sorts git(1) globals by effect: `info`, `config` (`-c`, `--config-env`), `location` (`-C`,
`--git-dir`, `--work-tree`, `--namespace`, `--attr-source`, `--super-prefix`), `program-path` (`--exec-path`) and
`switch`. `separate` marks options that also take their value as the next word. Overrides are
`{ via, key, value, environmentVariable }`; `-c key` alone means `true`; `--config-env` has no visible value.

## Why

Only words before the subcommand are global, so `branch --sort -committerdate` is never mistaken for `-c`. An unknown
or glued global (`-cfoo=bar`, `-C/x`) is recorded rather than guessed at, and the rule refuses readonly for it.
