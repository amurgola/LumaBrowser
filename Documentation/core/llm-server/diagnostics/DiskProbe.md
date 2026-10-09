# DiskProbe

`core/llm-server/diagnostics/DiskProbe.js`

Mounted volumes with total and free space, to size free disk for model weights.

## Methods

- `DiskProbe.probe()` resolves `{ available, source?, volumes, reason? }`
  (volumes from [DiskTableParser](DiskTableParser.md)).
  - Windows: PowerShell `Win32_LogicalDisk` (source `powershell`); if that
    fails or is unparseable, `wmic logicaldisk` (`wmic`; deprecated since
    Windows 11 but still present on most installs); if that yields nothing, an
    `fs.statfs` sweep of drive letters A to Z (`node-statfs`; no labels or
    filesystem types). All failing reports the PowerShell reason.
  - macOS and Linux: `df -P -k`, each row refined by `fs.statfs` for exact
    current numbers (source `df`).
  - Any throw becomes `{ available: false, reason, volumes: [] }`.
