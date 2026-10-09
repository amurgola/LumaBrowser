# SystemPaths

`core/shell/shellClassifier/SystemPaths.js`

Classifies a path argument as a filesystem or drive root, a home directory or a protected operating-system
location, with a reason naming what the location holds.

## Methods

- `SystemPaths.classify(path)`: `{ kind, reason }` or `null`. `kind` is `'root'`, `'home'` or `'system'`
  (`SystemPaths.ROOT/HOME/SYSTEM`). Reasons read like `/etc/ssh is inside /etc, which holds system-wide
  configuration` or `/* is everything in the filesystem root`. Flags (`-x`) and empty words are never protected.
- `SystemPaths.isRootOrSystemPath(path)`: `classify(path) !== null`.
- `SystemPaths.isDriveRoot(path)`: `/`, `C:`, `C:\` or a glob of their contents.
- `SystemPaths.normalize(path)`: surface cleanup only (see [HostPathSpelling](hostPaths/HostPathSpelling.md)).

Steps of `classify`: canonicalize the spelling, split a trailing contents glob (`*`, `**`, `*.*`), then try root,
home (`~`, `~user`, anything climbing out of `~`) and the [HostPathCatalog](hostPaths/HostPathCatalog.md).

## Why

Rules decide what an operation does; this class alone decides where it lands, so every rule shares one notion of
"protected". It sees through quotes, `$HOME`/`%SystemRoot%`/`${env:X}`, `..` and `//`, `\\?\` and `\\host\C$`
spellings, because a model (or an injected prompt) can produce any of them.
