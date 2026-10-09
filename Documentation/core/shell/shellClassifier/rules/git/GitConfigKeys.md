# GitConfigKeys

`core/shell/shellClassifier/rules/git/GitConfigKeys.js`

Catalog of config keys and environment variables whose value is a program, from git-config(1) and git(1).

## Methods

- `programLabel(key)`: what the key launches (`'a pager'`, `'an alias'`, ...) or `null`. Patterns are
  `section.variable` or `section.*.variable`; section and variable are case-insensitive.
- `variableLabel(name, value)`: same for `GIT_SSH_COMMAND`, `GIT_PAGER`, `EDITOR`, `GIT_EXEC_PATH`, ...;
  `GIT_CONFIG_KEY_<n>` is judged by the key it injects.
- `isNetworkOnly(label)`: ssh/transport commands and credential helpers only run when git reaches a remote.
- `isInert(value)`: `cat`, `true`, `:`, `less`, `more`, `false`, empty (quotes ignored). `null` is never inert.

## Groups

Pagers, editors, ssh/transport (`core.sshCommand`, `core.gitProxy`, `remote.*.uploadpack|receivepack`,
`protocol.allow`, `protocol.ext.allow`), credential helpers and askpass, diff/merge drivers (`diff.external`,
`diff.*.textconv|command`, `merge.*.driver`, `difftool|mergetool.*.cmd`, `interactive.diffFilter`), content filters,
hooks and monitors (`core.hooksPath`, `core.fsmonitor`, `hook.*.command`), signing programs, aliases, config includes,
browsers and man viewers, and helper commands (`core.alternateRefsCommand`, `uploadpack.packObjectsHook`,
`sendemail.*`).

## Why

`git -c core.pager=cat log` is a common way to stop paging; `GIT_EDITOR=true git rebase --continue` a common way to skip
an editor. Inert values keep those from asking for approval while any other program value does.
