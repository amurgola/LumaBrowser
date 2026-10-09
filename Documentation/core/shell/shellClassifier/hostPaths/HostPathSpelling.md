# HostPathSpelling

`core/shell/shellClassifier/hostPaths/HostPathSpelling.js`

Turns one path word into a comparable spelling.

## Methods

- `HostPathSpelling.normalize(path)`: trims, strips one pair of quotes, `\` to `/`, removes a PowerShell provider
  prefix (`FileSystem::`), drops trailing slashes except on `/` and `C:/`. No variables, no dot resolution.
- `HostPathSpelling.canonicalize(path)`: `normalize`, then expands variables
  ([HostPathVariables](HostPathVariables.md)), unwraps `\\?\`, `\\.\` and `\\?\UNC\`, maps admin shares
  (`\\host\C$`) to their drive, collapses slash runs and resolves `.`/`..`.
- `HostPathSpelling.unquote(text)`: strips one matching pair of quotes.

## Why

`..` never climbs above `/`, a drive root or a UNC share (as the OS behaves), but may climb above `~` because
`~/..` is every user's home. Only a backslash pair is treated as UNC: a forward-slash `//etc` is POSIX's `/etc`.
