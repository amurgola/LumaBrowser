# GitRule

`core/shell/shellClassifier/rules/GitRule.js`

[ShellRule](../ShellRule.md) for git. Built from the git(1), git-config(1) and per-subcommand manuals; the pieces live
under [rules/git/](git/GitInvocation.md).

## Methods

- `rule.assess({ name, args, dialect, assignments? })` judges `git` and dashed `git-<sub>` programs:
  1. [GitInvocation](git/GitInvocation.md) splits globals, config overrides and the subcommand.
  2. `hazardReason` -> mass-destructive with that reason.
  3. Else `isReadOnly` -> readonly. Else `null` (normal: commit, add, plain push, ...).
- `GitRule.hazardReason(invocation, assignments)`: [GitProgramHazards](git/GitProgramHazards.md) first (a launched
  program can do anything), then [GitHistoryHazards](git/GitHistoryHazards.md).
- `GitRule.isReadOnly(invocation)`: no `-c`/`--config-env`, no `--exec-path=<dir>`, no unknown global option; then
  either info-only (`git --version`, bare `--exec-path`) or a read form per [GitReadForms](git/GitReadForms.md).

`assignments` is the parser's `[{ name, value }]` for leading `VAR=value` words; the classifier passes them (also
for `env VAR=value git ...`), so `GIT_SSH_COMMAND=... git fetch` gets the `GIT_*` checks.

## Why

Three questions decide a git line: does it launch a program the caller picked, does it lose work or rewrite (remote)
history, does it only read. Each has its own class, so the rule reads as those steps and each catalog cites its manual.
Any injected config drops a read to normal even when the key is harmless; only keys that name a program, with a
non-inert value, rise to mass-destructive so a relaxed approval mode still asks.

## Classification changes from the previous GitRule

- Now readonly: `branch --sort -committerdate` (value-aware options), `tag -l v*` / `branch --list x*` (patterns in list
  mode), `config get|list`, `--version`, bare `--exec-path`, `annotate`, `show-branch`, `check-attr`,
  `check-mailmap`, `check-ref-format`, `diff-files`, `verify-commit`, `verify-tag`.
- No longer readonly: `remote -v add x y` (only the first word was checked), `symbolic-ref HEAD <ref>` (sets the
  ref), `stash list|show`/`reflog`/`shortlog` with `--output`/`--ext-diff`/`--textconv`, `grep -O`, `cat-file --filters`,
  abbreviated hazards such as `diff --out=x`, unknown or glued globals such as `-C/x`.
- Now mass-destructive: `-c`/`--config-env` program keys (pager, editor, alias, hooks, fsmonitor, filters, textconv,
  diff.external, credential/ssh on commands that can reach a remote, ...), `--exec-path=<dir>`, `--upload-pack`,
  `--receive-pack`, `--exec`, `--template`, `difftool -x`, `grep -O<pager>`, `clone -c <program key>`, `config` writes
  of a program key, `push origin :branch`, bundled `push -uf`, abbreviated `push --forc`, `switch -f/--discard-changes`,
  `branch -f/-C`, `git-filter-repo`.
- No longer mass-destructive: `restore --staged .` (index only), `prune -n`, `push --force-if-includes` alone (no-op).
