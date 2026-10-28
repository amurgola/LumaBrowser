# LinuxDistro

`core/shared/runtime/detect/LinuxDistro.js`

Which Linux distribution this host runs, from `/etc/os-release`, and
therefore which package manager installs system drivers here.

## Methods

- `LinuxDistro.probe({ platform, fsLike })` returns
  `{ linux, id, idLike, name, packageManager }`: `id` is `ID` lower-cased,
  `idLike` the `ID_LIKE` tokens, `name` `PRETTY_NAME` (else `NAME`, else the
  id), `packageManager` one of `pacman`, `apt`, `dnf` or null. Off Linux
  `linux` is false and the rest empty; an unreadable file gives an empty
  Linux probe.
- `LinuxDistro.parse(text)`: the `KEY=value` fields, unquoted.
- `LinuxDistro.managerFor(id, idLike)`: the id first, then each ID_LIKE token,
  against `MANAGERS`.
- `MANAGERS`: the ids each manager covers (Arch and its derivatives, Debian and
  Ubuntu derivatives, Fedora and the RHEL family).

## Why

[IntelDriverPlan](IntelDriverPlan.md) needs package names, and those differ
per distribution family. CachyOS, Manjaro and Mint only say what they are
like, so ID_LIKE is honoured.
