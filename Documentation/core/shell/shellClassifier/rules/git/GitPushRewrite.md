# GitPushRewrite

`core/shell/shellClassifier/rules/git/GitPushRewrite.js`

Spots `git push` forms that rewrite or delete history on the remote.

## Methods

- `GitPushRewrite.reason(rest)`: the first of `KINDS` present (`--mirror`, `--force`/`-f`, `--force-with-lease`,
  `--delete`/`-d`, `--prune`; abbreviations and bundles count), else a `:branch` refspec (delete) or a `+ref` refspec
  (forced update), else `null`.

Values of `--repo`, `-o`/`--push-option`, `--receive-pack` and `--exec` are skipped so they are never read as
refspecs or options.

## Why

Each kind loses something different on the remote, so each has its own reason on the approval card.
`--force-if-includes` alone does nothing and `--no-force-with-lease` cancels a lease, so neither counts.
