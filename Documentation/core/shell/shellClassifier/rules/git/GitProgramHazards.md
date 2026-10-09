# GitProgramHazards

`core/shell/shellClassifier/rules/git/GitProgramHazards.js`

Finds git command lines that make git launch a program the caller picked.

## Methods

- `GitProgramHazards.reason(invocation, assignments = [])`, first match wins:
  1. `--exec-path=<dir>`: git runs its own subcommands from there.
  2. `-c` / `--config-env` override of a [GitConfigKeys](GitConfigKeys.md) program key with a non-inert value.
  3. A `VAR=value` assignment naming a program (`GIT_SSH_COMMAND`, `GIT_PAGER`, `GIT_CONFIG_KEY_<n>`, ...).
  4. `PROGRAM_OPTIONS`: `fetch|pull|clone|ls-remote --upload-pack` (`-u` on clone and ls-remote),
     `push --receive-pack`, `push|archive --exec`, `clone|init --template`, `difftool -x/--extcmd`, and
     `grep -O<pager>` / `--open-files-in-pager=<pager>` (bare `-O` uses the user's own pager).
  5. `clone -c|--config <program key>=...`: written into the new repository before checkout.
  6. `config [set] <program key> <value>` (also `--add`, `--replace-all`): stores the program for later commands.

Steps 2 and 3 skip network-only programs (ssh command, credential helper) when the subcommand is a read that
[stays local](GitReadForms.md); writes, unknown subcommands and aliases may run hooks or fetch, so they count.

## Why

A pager, alias or filter set on the command line runs with the user's rights on an otherwise harmless command, and
hides that program from the rest of the classifier. Reporting it as mass-destructive with the key name lets the
approval card say exactly what would run.

Known gap: a partial clone may lazily fetch during a local read and use the ssh command anyway.
