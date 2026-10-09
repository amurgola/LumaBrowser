# DiskTableParser

`core/llm-server/diagnostics/DiskTableParser.js`

Turns disk listings into `{ mount, label, filesystem, driveType, totalBytes,
freeBytes }` volumes.

## Methods

- `fromLogicalDiskRows(rows)` from `Win32_LogicalDisk` JSON rows.
- `parseWmicCsv(text)` wmic `/format:csv`, columns found by header name; rows
  without a positive size are dropped.
- `parseDf(text)` `df -P -k` (KB): header skipped, mounts with spaces rejoined,
  label is the mount's basename; zero-size and pseudo filesystems (proc, sysfs,
  devtmpfs, tmpfs, cgroup, squashfs, overlay) dropped.
- `driveTypeName(code)` `fixed`, `removable`, `network`, ... or `type-<n>`.
