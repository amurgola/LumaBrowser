# GitHistoryHazards

`core/shell/shellClassifier/rules/git/GitHistoryHazards.js`

Names git forms that throw away work or rewrite history, with an approval-card reason.

## Methods

- `GitHistoryHazards.reason(subcommand, rest)`: runs the subcommand's entry in `CHECKS`, or `null`.

`CHECKS`, grouped by what is lost:

- Remote history: `push` ([GitPushRewrite](GitPushRewrite.md)), `filter-branch`, `filter-repo`.
- Local history and refs: any `rebase`; `reset --hard|--merge|--keep`; `branch -d/-D/--delete`,
  `-m/-M/--move`, `-f/--force`, `-C`; `tag -d/-f`; `update-ref -d`.
- Uncommitted work: `checkout --`/`.`/`-f`; `switch -f/--discard-changes`; `restore` touching the worktree (no
  `--staged`, or `--worktree`); `clean -f`; `stash drop|clear`; `worktree remove --force`, `worktree prune`.
- Recovery safety nets: `reflog expire|delete|drop`, `gc --prune`, `prune` (not `-n`), `remote remove|rm|prune`.

`BRANCH_VALUES` and `TAG_VALUES` list options whose next word is a value, so `--sort -committerdate` or
`-m -fd` never reads as `-d`/`-f`.

## Why

These are the forms a relaxed approval mode must still ask about. Everyday writes stay normal.
