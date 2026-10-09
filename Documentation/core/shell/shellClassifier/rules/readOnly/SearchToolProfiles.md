# SearchToolProfiles

`core/shell/shellClassifier/rules/readOnly/SearchToolProfiles.js`

[ProfileGroup](ProfileGroup.md) for file and content search tools.

- `FIND` (word grammar): executes with `-exec`, `-execdir`, `-ok`, `-okdir`; deletes with `-delete`; writes
  listings with `-fls`, `-fprint`, `-fprint0`, `-fprintf` (GNU findutils actions).
- `RIPGREP`: executes with `--pre`, `-z`/`--search-zip` (spawns decompressors) and `--hostname-bin`. Value letters
  are declared so `rg -e -z` (pattern "-z") reads and `rg -iz` does not.
- `FD` (`fd`, `fdfind`): `-x`/`--exec` and `-X`/`--exec-batch` run commands.
- `SILVER_SEARCHER` (`ag`): `--pager` runs a program.

## Why

Search is the agent's most common read; these are the documented options that turn a search into a runner or a
writer.
