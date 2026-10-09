# HostPathCatalog

`core/shell/shellClassifier/hostPaths/HostPathCatalog.js`

The protected host locations, grouped by what they hold, each with how far protection reaches below it.

## Methods

- `HostPathCatalog.locate(canonicalPath)`: `{ location, role, relation: 'is' | 'inside' }` or `null`. Case is ignored.
- `HostPathCatalog.POSIX`, `HostPathCatalog.WINDOWS`: frozen `{ location, role, scope }` entries.
- Scopes: `ITSELF` (the location and a glob of its contents), `ENTRIES` (plus each direct entry), `TREE` (everything
  beneath).

## Groups and sources

- Filesystem Hierarchy Standard 3.0: boot (`/boot`, `/efi`), programs and libraries (`/bin`, `/sbin`, `/lib*`,
  `/opt`, `/usr`), configuration (`/etc`), live state (`/run`, `/srv`, `/var`), kernel interfaces (`/dev`,
  `/proc`, `/sys`), `/root` (entries); `/home` and mount points (`/media`, `/mnt`) protect only themselves.
- macOS file-system domains: `/System` (tree, SIP-protected), `/Library`, `/Applications`, `/private` (entries),
  `/Users` and `/Volumes` (itself).
- Windows system volume, on any drive letter: `Windows` (tree), `Program Files`, `Program Files (x86)`,
  `ProgramData`, `Users`, boot and recovery files, `$Recycle.Bin`, `System Volume Information`, paging files.

## Why

Depth is per location: deleting `/etc/ssh` breaks a machine, deleting `/home/me/project/build` is ordinary work.
Comparison ignores case because Windows and default macOS volumes do. `/tmp` is deliberately absent: clearing it
is routine.
