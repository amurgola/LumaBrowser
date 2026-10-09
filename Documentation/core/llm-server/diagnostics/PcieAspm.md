# PcieAspm

`core/llm-server/diagnostics/PcieAspm.js`

Reads and disables PCI Express Link State Power Management on the active
Windows power plan. ASPM on an M.2-riser slot is the most common reason a GPU
there pseudo-disconnects; forcing it off is the standard durable fix.

## Methods

- `PcieAspm.read()` resolves `{ available: true, ac, dc, acLabel, dcLabel,
  alreadyOff }` or `{ available: false, reason }` (Windows only).
- `PcieAspm.setOff()` sets AC and DC to 0 and re-activates the scheme, then
  resolves `{ success: true, state: <read()> }` or `{ success: false, error }`.
  Reversible and needs no elevation for the current user's scheme. Each
  `powercfg` call checks `$LASTEXITCODE`, because `$ErrorActionPreference` does
  not catch a native exe's non-zero exit.
- `PcieAspm.parse(stdout)` the `powercfg /q` parser; labels `Off`, `Moderate
  power savings`, `Maximum power savings`, else `value N` or `unknown`.
- `SUBGROUP_GUID`, `SETTING_GUID` (stable across Windows builds).
