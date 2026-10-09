# ProcessPattern

`core/shell/shellClassifier/rules/system/ProcessPattern.js`

One process-name selector from a kill command, read the way its tool reads it.

## Methods

- `new ProcessPattern(text, kind)`: kinds `REGEX` (pkill, killall), `GLOB` (taskkill `/IM`, Stop-Process `-Name`),
  `EXACT` (tskill). Case-insensitive; a trailing `.exe` is ignored on both sides.
- `hits(name)`: the tool's own matching (regex searches anywhere; globs and exact names match the whole name).
- `names(name)`: whole-name match for any kind, used for OS and shared-process checks so `pkill -f server` is not
  read as targeting WindowServer.
- `hitsEverything()`: true when it hits a set of unrelated names (`.`, `.*`, `^`, `*`, `*.exe`, `[a-z0-9]`).
- `isWildcard()`: a glob containing `*` or `?`.

An invalid regex is matched literally instead of throwing.
