# GitReadForms

`core/shell/shellClassifier/rules/git/GitReadForms.js`

Decides whether a git subcommand with its words only reads.

## Methods

- `reads(subcommand, rest)`: the subcommand has a profile, carries no option hazard, and its form reads.
- `staysLocal(subcommand)`: a known read that never contacts a remote (not `remote`, `submodule`).
- `hazardIn(profile, rest)`: an `OPTION_HAZARDS` family option is present.

## Profiles

`PROFILES` maps each subcommand to a `form`:

- `always`: viewers and plumbing (`log`, `diff`, `show`, `blame`, `grep`, `cat-file`, `rev-parse`, `status`, ...).
- `list`: `branch` / `tag` with only known list options (`BRANCH_LIST`, `TAG_LIST`); extra words are allowed only
  when an `implyList` option (`--list`, `--contains`, `-n`, ...) makes them patterns.
- `verb`: `remote`, `stash`, `worktree`, `submodule`, `notes` with allowed leading options, then a read verb or none.
- `reflog` (anything but `expire`/`delete`/`drop`), `config` (`get`/`list` verbs, a read mode, or one dotted key),
  `symbolicRef` (one ref, no `-d`/`-m`).

Hazard families: `diffOutput` (`--output` writes a file, `--ext-diff`/`--textconv` run programs) on diff and log
viewers and on `stash`, `reflog`, `shortlog`; `attribution` (`--textconv`); `search` (`-O`/`--open-files-in-pager`,
`--textconv`); `objectDump` (`--textconv`, `--filters`).

## Why

Read-only is a positive allowlist: an unknown subcommand, verb or option is not a read. Profiles keep each manual
page's rules in one row instead of scattered checks.
